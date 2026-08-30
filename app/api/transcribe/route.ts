import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Whisper transcription is not configured" }, { status: 503 });
  }
  const form = await request.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Invalid audio recording" }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("file", audio, audio.name || "voice-note.webm");
  upstream.append("model", "whisper-1");
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: upstream,
  });
  if (!response.ok) {
    return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
  }
  const result = await response.json() as { text?: string };
  return NextResponse.json({ text: result.text ?? "" });
}
