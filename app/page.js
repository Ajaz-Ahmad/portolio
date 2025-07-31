// Portfolio Website for Ajaz Ahmad
// Tech Stack: Next.js + Tailwind CSS + LangChain + Agentic AI + Computer Vision

import React from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Sparkles, Cpu, Brain } from "lucide-react";
import LLMAgentChat from "../components/LLMAgentChat";

export default function Portfolio() {
  return (
    <main className="p-6 max-w-6xl mx-auto space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Ajaz Ahmad</h1>
        <p className="text-lg text-gray-600">
          AI/ML Leader | LangChain Expert | Agentic AI Innovator | Computer Vision Engineer
        </p>
        <div className="space-x-4">
          <Button asChild><a href="/resume.pdf" target="_blank">Download CV</a></Button>
          <Button asChild variant="outline"><a href="mailto:khanajaz8395@gmail.com">Contact Me</a></Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">🧠 Featured Skills</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Brain />
                <h3 className="text-xl font-semibold">LangChain & LLMs</h3>
              </div>
              <p className="mt-2 text-gray-600">
                Built GPT-powered assistants using LangChain, RAG pipelines, prompt engineering, and tool/function calling.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Sparkles />
                <h3 className="text-xl font-semibold">Agentic AI</h3>
              </div>
              <p className="mt-2 text-gray-600">
                Designed fallback-enabled agents with memory and tool use; created eval harnesses and orchestration flows beyond LangChain templates.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Cpu />
                <h3 className="text-xl font-semibold">Computer Vision</h3>
              </div>
              <p className="mt-2 text-gray-600">
                Experience with MIL, Vision Transformers, self-attention, slide segmentation, and evaluation pipelines.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">📂 Selected Projects</h2>
        <ul className="space-y-4 text-gray-700 list-disc list-inside">
          <li>
            <strong>Multimodal QA Agent:</strong> Combined image-derived metadata, OCR, and GPT-4 agents to automate QA for pathology reports, achieving 95%+ accuracy.
          </li>
          <li>
            <a href="/projects/rag-toolkit" className="text-blue-600 hover:underline">
              <strong>RAG Evaluation Toolkit:</strong>
            </a>
            Framework for measuring groundedness and latency in LLM-RAG pipelines, used to optimize hybrid retrieval.
          </li>
          <li>
            <strong>Wearable-Driven Health Assistant:</strong> Designed time-series-aware LLM agent that ingests simulated Fitbit logs and produces daily personalized insights using GPT-4 + rules engine.
          </li>
          <li>
            <strong>LLM Metadata Validator:</strong> GPT-4 assistant for verifying and correcting pathology slide metadata with structured JSON output.
          </li>
          <li>
            <strong>Clinical RAG Assistant:</strong> LangChain-powered tool to retrieve SOPs, protocols and answer free-text medical questions.
          </li>
          <li>
            <strong>Vision Segmentation Pipeline:</strong> Deployed MIL-based model for slide-level classification in colorectal cancer screening.
          </li>
        </ul>

        <div className="flex space-x-4 mt-6">
          <Button asChild>
            <a href="https://github.com/ajaz/rag-eval-toolkit" target="_blank">
              RAG Toolkit Code
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="https://multimodal-agent.vercel.app" target="_blank">
              Live Agent Demo
            </a>
          </Button>
        </div>
      </section>
      <section>
          <LLMAgentChat />
    </section>
    </main>
  );
}
