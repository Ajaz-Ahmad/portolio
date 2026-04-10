import { NextResponse } from "next/server";

const MAX_WORDS_PER_CHUNK = 200;

/**
 * Parse Wikipedia plain-text extract (from the MediaWiki API) into
 * section-aware paragraphs, mirroring the Python project's loader.py.
 * Headings are encoded as == Section == and === Subsection === in the extract.
 */
function parseWikipediaExtract(text, url) {
  const lines = text.split("\n");
  const rawChunks = [];

  let section = "";
  let subsection = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const h2 = trimmed.match(/^==\s+(.+?)\s+==$/);
    const h3 = trimmed.match(/^===\s+(.+?)\s+===$/);
    const h4 = trimmed.match(/^====\s+(.+?)\s+====$/);

    if (h4) {
      subsection = h4[1];
    } else if (h3) {
      subsection = h3[1];
    } else if (h2) {
      section = h2[1];
      subsection = "";
    } else {
      // Paragraph
      rawChunks.push({ text: trimmed, section, subsection, source: url });
    }
  }

  return rawChunks;
}

/**
 * Merge consecutive paragraphs that share the same section into single chunks,
 * keeping each chunk under MAX_WORDS_PER_CHUNK — mirrors chunker.py's merge logic.
 */
function mergeChunks(rawChunks) {
  const merged = [];
  let currentSection = null;
  let currentSubsection = null;
  let currentText = "";
  let currentSource = "";

  function flush() {
    if (currentText.trim().length > 80) {
      merged.push({ section: currentSection, subsection: currentSubsection, text: currentText.trim(), source: currentSource });
    }
  }

  for (const chunk of rawChunks) {
    const sameSection = chunk.section === currentSection && chunk.subsection === currentSubsection;
    const incomingWords = chunk.text.split(/\s+/).length;
    const currentWords = currentText.split(/\s+/).length;

    if (!sameSection) {
      flush();
      currentSection = chunk.section;
      currentSubsection = chunk.subsection;
      currentText = chunk.text;
      currentSource = chunk.source;
    } else if (currentWords + incomingWords > MAX_WORDS_PER_CHUNK) {
      flush();
      currentText = chunk.text;
    } else {
      currentText += " " + chunk.text;
    }
  }
  flush();

  return merged.map((c, i) => ({ id: i, ...c }));
}

export async function POST(request) {
  let url;
  try {
    ({ url } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url field." }, { status: 400 });
  }

  const match = url.match(/en\.wikipedia\.org\/wiki\/([^#?]+)/);
  if (!match) {
    return NextResponse.json(
      { error: "Please provide a valid English Wikipedia URL, e.g. https://en.wikipedia.org/wiki/Diabetes" },
      { status: 400 }
    );
  }

  const title = decodeURIComponent(match[1].replace(/_/g, " "));

  const apiUrl =
    `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true` +
    `&titles=${encodeURIComponent(title)}&format=json&origin=*`;

  let data;
  try {
    const res = await fetch(apiUrl, { headers: { "User-Agent": "PortfolioRAGDemo/1.0" } });
    if (!res.ok) throw new Error(`Wikipedia API returned ${res.status}`);
    data = await res.json();
  } catch (err) {
    return NextResponse.json({ error: `Failed to fetch Wikipedia article: ${err.message}` }, { status: 502 });
  }

  const pages = data?.query?.pages ?? {};
  const page = Object.values(pages)[0];

  if (!page || page.missing !== undefined) {
    return NextResponse.json({ error: `Wikipedia article "${title}" not found.` }, { status: 404 });
  }

  const rawChunks = parseWikipediaExtract(page.extract ?? "", url);
  const chunks = mergeChunks(rawChunks);

  if (chunks.length === 0) {
    return NextResponse.json({ error: "Could not extract any content from this article." }, { status: 422 });
  }

  return NextResponse.json({ title: page.title, chunks, total: chunks.length });
}
