import { NextResponse } from "next/server";

const RAG_BACKEND = process.env.RAG_BACKEND_URL?.replace(/\/$/, "");

const STOP_WORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","must","can",
  "to","of","in","for","on","with","at","by","from","that","this","it","its",
  "what","when","where","who","how","why","and","or","but","not","so","if","as",
  "about","into","than","then","there","they","their","them","we","our","you",
  "your","he","she","his","her","i","my","me","which","also","very",
]);

function tokenize(text) {
  return text.toLowerCase().split(/\W+/).filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

function scoreChunk(chunkText, tokens) {
  const lower = chunkText.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    const re = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g");
    const hits = lower.match(re);
    if (hits) score += hits.length;
  }
  return score;
}

export async function POST(request) {
  let question, chunks, session_key;
  try { ({ question, chunks, session_key } = await request.json()); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  if (!question) return NextResponse.json({ error: "Missing question." }, { status: 400 });

  // ── Proxy to Python backend (session_key flow) ───────────────────────────
  if (RAG_BACKEND && session_key) {
    try {
      const res = await fetch(`${RAG_BACKEND}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, session_key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Backend query failed.");
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
  }

  // ── Built-in JS pipeline (chunks flow) ──────────────────────────────────
  if (!Array.isArray(chunks) || chunks.length === 0)
    return NextResponse.json({ error: "No chunks provided. Ingest a Wikipedia article first." }, { status: 400 });

  const tokens = tokenize(question);
  const topK = chunks
    .map(c => ({ ...c, score: scoreChunk(c.text, tokens) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const sources = topK.map(c => ({
    section: c.section || "Introduction",
    subsection: c.subsection || "",
    preview: c.text.substring(0, 160) + (c.text.length > 160 ? "…" : ""),
    score: c.score,
  }));

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      answer: topK[0]?.text ?? "No relevant content found.",
      sources,
      note: "Set OPENAI_API_KEY for GPT-generated answers. Showing best matching chunk.",
    });
  }

  const context = topK.map((c, i) => `[${i + 1}] ${c.text}`).join("\n\n");
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Answer using only the provided context. Be concise and cite source numbers [1], [2]." },
          { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
        ],
        max_tokens: 512, temperature: 0.2,
      }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message ?? `OpenAI ${res.status}`); }
    const result = await res.json();
    return NextResponse.json({ answer: result.choices?.[0]?.message?.content ?? "No answer.", sources });
  } catch (err) {
    return NextResponse.json({ error: `Generation failed: ${err.message}` }, { status: 502 });
  }
}
