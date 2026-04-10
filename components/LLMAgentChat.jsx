"use client";
import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  "What is Ajaz's current role?",
  "What RAG systems has he built?",
  "What are his top skills?",
  "Tell me about his experience at Deciphex",
];

export default function LLMAgentChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const question = text ?? input;
    if (!question.trim()) return;
    setError("");
    setLoading(true);

    const updated = [...messages, { role: "user", content: question }];
    setMessages(updated);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      setMessages([...updated, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err.message);
      setMessages(updated);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="max-w-2xl mx-auto mt-4 border rounded-xl shadow-sm bg-white overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h2 className="text-xl font-semibold">Ask About Ajaz</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Powered by Mistral-7B on HuggingFace — ask anything about his background, skills, or experience.
        </p>
      </div>

      {/* Message area */}
      <div className="h-72 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
        {isEmpty && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400 text-center mb-3">Try one of these:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="block w-full text-left text-sm border rounded-lg px-3 py-2 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors text-gray-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white border text-gray-800 rounded-bl-sm shadow-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border px-4 py-2 rounded-2xl rounded-bl-sm shadow-sm text-sm text-gray-400 italic">
              Thinking…
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t bg-white flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about skills, experience, projects…"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
