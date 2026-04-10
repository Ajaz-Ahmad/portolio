import { NextResponse } from "next/server";

const CV_CONTEXT = `
Ajaz Ahmad — Applied ML Engineer
Email: khanajaz8395@gmail.com | Phone: +353-0899655863

SUMMARY
7+ years building production-grade ML systems in healthcare & enterprise SaaS. Expert in supervised learning, weak supervision (MIL), model robustness, drift detection, explainability, and large-scale distributed training. Recently built an enterprise RAG system for PBM contract intelligence at OptumTech.

CURRENT ROLE
OptumTech – AI Engineer (Enterprise AI Systems) | Nov 2025 – Present
- Designed and deployed RAG system for PBM contract intelligence over enterprise legal documents
- Built semantic retrieval pipeline with structured chunking and vector indexing for clause-level search
- Integrated LLM reasoning layer to extract pricing terms, rebate clauses, compliance-sensitive language
- Designed evaluation workflows to benchmark retrieval precision and answer grounding accuracy
- Implemented validation mechanisms to reduce hallucinations in legally sensitive outputs
- Leveraged MLflow for experiment tracking, versioned deployments, and inference monitoring
Impact: Reduced manual contract review time, improved structured extraction accuracy, enabled searchable intelligence layer over static documents

PREVIOUS ROLE
Deciphex, Dublin, Ireland – AI Engineer | Nov 2019 – 2025
- Extracted entities (NER) from unstructured data using BERT; achieved 90% accuracy
- Built enterprise-grade Clinical RAG Assistant for 50k+ pathology slides using GPT-4 and LangChain; 95%+ metadata validation accuracy via OCR
- Fine-tuned open-source LLMs (LLaMA 2) with LoRA/PEFT for enterprise RAG pipeline integration
- Created production-ready LLM agents with prompt fallback strategies; reduced metadata QA effort by 75%
- Implemented data drift detection for page layout, table structures, and sentence formatting
- Developed stain augmentation techniques for scanner/brightness variability across clinical datasets
- Designed end-to-end monitoring and explainability framework with drift detection, UMAP/t-SNE, and probability mask visualization for regulatory compliance

SKILLS
GenAI & LLMs: GPT-4, LLaMA 2/3, LangChain Agents, OpenAI Functions, RAG, structured prompting, fallback strategies, knowledge-grounded chatbots, semantic search
ML & Data: Classical ML, Deep Learning, Computer Vision, NLP, Scikit-learn, UMAP, PCA, XGBoost, Multimodal AI, FAISS, OpenAISearch, hybrid retrieval
Infrastructure: FastAPI, Docker, Kubernetes, Azure Document Intelligence, CI/CD, MLOps, model versioning, observability
Backend: Python, MongoDB, SQL, TensorFlow, PyTorch, Spacy, NLTK, HuggingFace

EDUCATION
- MSc Electronics and Computer Engineering (AI/ML specialization) — Dublin City University, Ireland (2018–2019)
- PG Diploma in Advanced Computing — SunBeam Institute of Information Technology, India
- B.Tech Electronics and Electrical Engineering — Dr. A.P.J. Abdul Kalam Technical University, India
`.trim();

export async function POST(request) {
  let messages;
  try {
    ({ messages } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing messages." }, { status: 400 });
  }

  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    return NextResponse.json(
      { error: "Chat service is not configured. Please contact the portfolio owner." },
      { status: 503 }
    );
  }

  const payload = {
    model: "mistralai/Mistral-7B-Instruct-v0.3",
    messages: [
      {
        role: "system",
        content:
          `You are a helpful assistant representing Ajaz Ahmad's professional profile. ` +
          `Answer questions about his background, skills, and experience based on his CV below. ` +
          `Be concise, friendly, and professional. If asked something not in the CV, say so honestly.\n\n` +
          `CV:\n${CV_CONTEXT}`,
      },
      ...messages,
    ],
    max_tokens: 512,
    temperature: 0.4,
  };

  try {
    const res = await fetch(
      "https://router.huggingface.co/hf-inference/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${hfToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `HuggingFace API returned ${res.status}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "No response received.";
    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ error: `Chat failed: ${err.message}` }, { status: 502 });
  }
}
