"use client";
import { useState } from "react";

const SUGGESTIONS = [
  "Which cases show lymphovascular invasion?",
  "What Gleason score is the prostate case?",
  "Summarise the lung cancer molecular findings",
  "Which slide has the worst prognosis?",
];

const CONFIDENCE_COLOR = {
  high: "text-green-700 bg-green-50 border-green-200",
  medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  low: "text-gray-600 bg-gray-50 border-gray-200",
};

export default function ClinicalRAGChat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [sources, setSources] = useState([]);
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleQuery(q) {
    const text = q ?? question;
    if (!text.trim()) return;
    setError("");
    setAnswer(null);
    setSources([]);
    setLatency(null);
    setLoading(true);

    try {
      const res = await fetch("/api/clinical/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Query failed.");
      setAnswer(data.answer);
      setSources(data.sources ?? []);
      setLatency(data.latency_ms);
      if (q == null) setQuestion("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-4 space-y-4">
      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Clinical RAG Assistant</h2>
          <p className="text-sm text-gray-500 mt-1">
            Hybrid retrieval (FAISS + BM25) over 12 pathology demo cases. Powered by Llama 3.3 via Groq.
          </p>
        </div>

        {/* Suggestion chips */}
        {!answer && !loading && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleQuery(s)}
                className="text-xs border rounded-full px-3 py-1.5 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors text-gray-600"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about diagnoses, staging, molecular markers…"
            disabled={loading}
          />
          <button
            onClick={() => handleQuery()}
            disabled={loading || !question.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Thinking…" : "Ask"}
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Answer card */}
      {answer && (
        <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Answer</p>
            {latency && (
              <span className="text-xs text-gray-400">{latency}ms</span>
            )}
          </div>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{answer}</p>

          {sources.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Retrieved Sources
              </p>
              <ul className="space-y-2">
                {sources.map((s, i) => (
                  <li key={i} className="text-sm bg-gray-50 border rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-blue-700">[{i + 1}] {s.slide_id}</span>
                      <span className="text-gray-500">— {s.tissue_site} · {s.slide_type}</span>
                      <span
                        className={`ml-auto text-xs border rounded-full px-2 py-0.5 font-medium ${
                          CONFIDENCE_COLOR[s.confidence] ?? CONFIDENCE_COLOR.low
                        }`}
                      >
                        {s.confidence}
                      </span>
                    </div>
                    <p className="text-gray-600">{s.preview}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => { setAnswer(null); setSources([]); setLatency(null); }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
