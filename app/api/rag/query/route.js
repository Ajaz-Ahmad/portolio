import { NextResponse } from "next/server";

const STOP_WORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being",
  "have","has","had","do","does","did","will","would","could","should",
  "may","might","must","can","to","of","in","for","on","with","at",
  "by","from","that","this","it","its","what","when","where","who",
  "how","why","and","or","but","not","so","if","as","about","into",
  "than","then","there","they","their","them","we","our","you","your",
  "he","she","his","her","i","my","me","which","also","been","very",
]);

/**
 * Score a chunk by keyword overlap with the question.
 * Mirrors the retrieval intent of the Python project's HybridRetriever,
 * using BM25-style term frequency without requiring embeddings in serverless.
 */
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

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

export async function POST(request) {
  let question, chunks;
  try {
    ({ question, chunks } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Missing question field." }, { status: 400 });
  }
  if (!Array.isArray(chunks) || chunks.length === 0) {
    return NextResponse.json({ error: "No chunks provided. Ingest a Wikipedia article first." }, { status: 400 });
  }

  const tokens = tokenize(question);

  const scored = chunks
    .map((chunk) => ({ ...chunk, score: scoreChunk(chunk.text, tokens) }))
    .sort((a, b) => b.score - a.score);

  const topK = scored.slice(0, 4);
  const context = topK.map((c, i) => `[${i + 1}] ${c.text}`).join("\n\n");

  const sources = topK.map((c) => ({
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

  let answer;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Answer the user's question using only the provided context. " +
              "Be concise and cite which source numbers support your answer (e.g. [1], [2]).",
          },
          {
            role: "user",
            content: `Context:\n${context}\n\nQuestion: ${question}`,
          },
        ],
        max_tokens: 512,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `OpenAI returned ${res.status}`);
    }

    const result = await res.json();
    answer = result.choices?.[0]?.message?.content ?? "Could not generate an answer.";
  } catch (err) {
    return NextResponse.json({ error: `Generation failed: ${err.message}` }, { status: 502 });
  }

  return NextResponse.json({ answer, sources });
}
