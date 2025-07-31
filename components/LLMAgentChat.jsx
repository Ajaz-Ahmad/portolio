"use client";
import { useState } from "react";

export default function LLMAgentChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    setLoading(true);
    const res = await fetch("https://fcdb6a30691b1ee2ab.gradio.live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [input] })
    });
    const result = await res.json();
    const reply = result.data?.[0] || "No response";

    setMessages([...messages, { role: "user", text: input }, { role: "bot", text: reply }]);
    setInput("");
    setLoading(false);
  }

  return (
    <div className="bg-white border p-4 rounded-lg shadow-sm space-y-3 max-w-2xl mx-auto mt-12">
      <h2 className="text-xl font-semibold">🤖 Talk to My LLM Agent</h2>
      <div className="space-y-2 max-h-72 overflow-y-auto border p-2 rounded bg-gray-50">
        {messages.map((m, i) => (
          <p key={i} className={m.role === "user" ? "text-right text-blue-600" : "text-left text-black"}>
            {m.text}
          </p>
        ))}
        {loading && <p className="text-gray-400 italic">Agent is thinking...</p>}
      </div>
      <div className="flex">
        <input
          className="flex-1 border p-2 rounded-l"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about projects, AI, health use cases..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-r"
        >
          Send
        </button>
      </div>
    </div>
  );
}
