import { NextResponse } from "next/server";

const CLINICAL_BACKEND = process.env.CLINICAL_RAG_BACKEND_URL?.replace(/\/$/, "");

export async function POST(request) {
  let question;
  try {
    ({ question } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!question?.trim()) {
    return NextResponse.json({ error: "Missing question." }, { status: 400 });
  }

  if (!CLINICAL_BACKEND) {
    return NextResponse.json(
      { error: "Clinical RAG service is not configured. Please contact the portfolio owner." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${CLINICAL_BACKEND}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail ?? "Backend query failed.");
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: `Query failed: ${err.message}` }, { status: 502 });
  }
}
