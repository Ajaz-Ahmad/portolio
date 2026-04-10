import { NextResponse } from "next/server";

// Server-side only — no NEXT_PUBLIC_ prefix intentionally.
// When set, requests are proxied to the Python backend (no CORS issues).
// When absent, the built-in JS pipeline runs directly on Vercel.
const RAG_BACKEND = process.env.RAG_BACKEND_URL?.replace(/\/$/, "");

// ── Built-in JS pipeline (fallback) ─────────────────────────────────────────

const MAX_WORDS_PER_CHUNK = 200;

function parseWikipediaExtract(text, url) {
  const lines = text.split("\n");
  const rawChunks = [];
  let section = "";
  let subsection = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const h4 = trimmed.match(/^====\s+(.+?)\s+====$/);
    const h3 = trimmed.match(/^===\s+(.+?)\s+===$/);
    const h2 = trimmed.match(/^==\s+(.+?)\s+==$/);
    if (h4) { subsection = h4[1]; }
    else if (h3) { subsection = h3[1]; }
    else if (h2) { section = h2[1]; subsection = ""; }
    else { rawChunks.push({ text: trimmed, section, subsection, source: url }); }
  }
  return rawChunks;
}

function mergeChunks(rawChunks) {
  const merged = [];
  let curSection = null, curSubsection = null, curText = "", curSource = "";

  function flush() {
    if (curText.trim().length > 80)
      merged.push({ section: curSection, subsection: curSubsection, text: curText.trim(), source: curSource });
  }

  for (const chunk of rawChunks) {
    const same = chunk.section === curSection && chunk.subsection === curSubsection;
    const words = (curText + " " + chunk.text).split(/\s+/).length;
    if (!same) { flush(); curSection = chunk.section; curSubsection = chunk.subsection; curText = chunk.text; curSource = chunk.source; }
    else if (words > MAX_WORDS_PER_CHUNK) { flush(); curText = chunk.text; }
    else { curText += " " + chunk.text; }
  }
  flush();
  return merged.map((c, i) => ({ id: i, ...c }));
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(request) {
  let url;
  try { ({ url } = await request.json()); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  if (!url || !url.includes("en.wikipedia.org/wiki/"))
    return NextResponse.json({ error: "Please provide a valid English Wikipedia URL." }, { status: 400 });

  // ── Proxy to Python backend ──────────────────────────────────────────────
  if (RAG_BACKEND) {
    try {
      const res = await fetch(`${RAG_BACKEND}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Backend ingest failed.");
      // Return session_key so the query route can proxy correctly
      return NextResponse.json({ title: data.title, session_key: data.session_key, total: data.chunks_count, mode: "backend" });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
  }

  // ── Built-in JS pipeline ─────────────────────────────────────────────────
  const match = url.match(/en\.wikipedia\.org\/wiki\/([^#?]+)/);
  const title = decodeURIComponent(match[1].replace(/_/g, " "));
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&titles=${encodeURIComponent(title)}&format=json&origin=*`;

  let data;
  try {
    const res = await fetch(apiUrl, { headers: { "User-Agent": "PortfolioRAGDemo/1.0" } });
    if (!res.ok) throw new Error(`Wikipedia API returned ${res.status}`);
    data = await res.json();
  } catch (err) {
    return NextResponse.json({ error: `Failed to fetch Wikipedia article: ${err.message}` }, { status: 502 });
  }

  const page = Object.values(data?.query?.pages ?? {})[0];
  if (!page || page.missing !== undefined)
    return NextResponse.json({ error: `Wikipedia article "${title}" not found.` }, { status: 404 });

  const chunks = mergeChunks(parseWikipediaExtract(page.extract ?? "", url));
  if (chunks.length === 0)
    return NextResponse.json({ error: "Could not extract any content from this article." }, { status: 422 });

  return NextResponse.json({ title: page.title, chunks, total: chunks.length, mode: "js" });
}
