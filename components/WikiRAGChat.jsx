"use client";
import { useState } from "react";

const STEPS = { IDLE: "idle", INGESTING: "ingesting", READY: "ready", QUERYING: "querying" };

export default function WikiRAGChat() {
  const [url, setUrl] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [chunks, setChunks] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [sources, setSources] = useState([]);
  const [note, setNote] = useState("");
  const [step, setStep] = useState(STEPS.IDLE);
  const [error, setError] = useState("");

  async function handleIngest(e) {
    e.preventDefault();
    setError("");
    setAnswer(null);
    setSources([]);
    setChunks([]);
    setStep(STEPS.INGESTING);

    try {
      const res = await fetch("/api/rag/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ingestion failed.");
      setChunks(data.chunks);
      setArticleTitle(data.title);
      setStep(STEPS.READY);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.IDLE);
    }
  }

  async function handleQuery(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setError("");
    setAnswer(null);
    setSources([]);
    setNote("");
    setStep(STEPS.QUERYING);

    try {
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, chunks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Query failed.");
      setAnswer(data.answer);
      setSources(data.sources ?? []);
      setNote(data.note ?? "");
      setStep(STEPS.READY);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.READY);
    }
  }

  const isIngesting = step === STEPS.INGESTING;
  const isQuerying = step === STEPS.QUERYING;
  const hasArticle = step === STEPS.READY || isQuerying;

  return (
    <div className="max-w-3xl mx-auto mt-12 space-y-4">
      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Wikipedia RAG Assistant</h2>
          <p className="text-sm text-gray-500 mt-1">
            Paste any English Wikipedia URL, then ask questions grounded in that article.
          </p>
        </div>

        {/* Step 1 — URL ingestion */}
        <form onSubmit={handleIngest} className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://en.wikipedia.org/wiki/Diabetes"
            required
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isIngesting || isQuerying}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isIngesting ? "Loading…" : hasArticle ? "Reload" : "Load Article"}
          </button>
        </form>

        {/* Article status badge */}
        {hasArticle && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            <span>
              <strong>{articleTitle}</strong> — {chunks.length} chunks indexed
            </span>
          </div>
        )}

        {/* Step 2 — Q&A (only after article loaded) */}
        {hasArticle && (
          <form onSubmit={handleQuery} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about this article…"
              required
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isQuerying}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isQuerying ? "Thinking…" : "Ask"}
            </button>
          </form>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Answer card */}
      {answer && (
        <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Answer</p>
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{answer}</p>
            {note && <p className="text-xs text-amber-600 mt-2 italic">{note}</p>}
          </div>

          {sources.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Sources</p>
              <ul className="space-y-2">
                {sources.map((s, i) => (
                  <li key={i} className="text-sm bg-gray-50 border rounded-lg px-3 py-2">
                    <span className="font-medium text-blue-700">
                      [{i + 1}]{s.section ? ` ${s.section}` : ""}
                      {s.subsection ? ` › ${s.subsection}` : ""}
                    </span>
                    <p className="text-gray-600 mt-0.5">{s.preview}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
