"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Lightbulb, Loader2, MessageCircleQuestion, Mic, MicOff, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type VoiceResult = {
  manuscriptAddition: string;
  response: string;
  questions: string[];
  suggestions: string[];
  mode: "ai" | "local";
};

type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};

type RecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

type RecognitionConstructor = new () => RecognitionLike;

function getRecognition(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return;
  const speechWindow = window as typeof window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

export function VoiceAssistant({
  chapterId,
  onInsert,
}: {
  chapterId: string;
  onInsert: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    window.speechSynthesis?.cancel();
  }, []);

  async function startListening() {
    const Recognition = getRecognition();
    if (!Recognition) {
      await startWhisperFallback();
      return;
    }
    setError("");
    setResult(null);
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = document.documentElement.lang || "en-US";
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const item = event.results[index];
        if (item.isFinal) finalText += item[0].transcript + " ";
        else interimText += item[0].transcript;
      }
      if (finalText) setTranscript((current) => (current + " " + finalText).trim());
      setInterim(interimText);
    };
    recognition.onerror = (event) => {
      setListening(false);
      setError(event.error === "not-allowed" ? "Microphone permission was not granted. You can enable it in your browser settings." : "I could not hear clearly. Please try again.");
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setListening(false);
  }

  async function startWhisperFallback() {
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
      setError("Voice capture is not available in this browser. You can still type your thought above.");
      return;
    }
    try {
      setError("");
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setThinking(true);
        try {
          const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const form = new FormData();
          form.append("audio", audio, "voice-note.webm");
          const response = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setTranscript((current) => (current + " " + data.text).trim());
        } catch {
          setError("Whisper transcription needs an OpenAI API key. You can still type your thought above.");
        } finally {
          setThinking(false);
        }
      };
      recorder.start();
      setListening(true);
    } catch {
      setError("Microphone permission was not granted. You can enable it in your browser settings.");
    }
  }

  async function reflect() {
    const spokenText = (transcript + " " + interim).trim();
    if (spokenText.length < 5) {
      setError("Share a little more before asking DigiKatha to reflect.");
      return;
    }
    stopListening();
    setThinking(true);
    setError("");
    try {
      const response = await fetch("/api/voice-assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chapterId, transcript: spokenText }),
      });
      if (!response.ok) throw new Error("Unable to reflect");
      const nextResult = await response.json() as VoiceResult;
      setResult(nextResult);
      speak(nextResult.response);
    } catch {
      setError("DigiKatha could not reflect on that just now. Your transcript is still safe here.");
    } finally {
      setThinking(false);
    }
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => /Samantha|Google UK English Female|Microsoft Aria/i.test(voice.name)) ?? voices.find((voice) => voice.lang.startsWith("en")) ?? null;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  function insertDraft() {
    if (!result?.manuscriptAddition) return;
    onInsert(result.manuscriptAddition);
    setResult({ ...result, manuscriptAddition: "" });
  }

  function close() {
    stopListening();
    stopSpeaking();
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="border-[#d9f45f]/80 bg-[#f9fce9]">
        <Mic size={15} />Voice Muse
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/25 p-0 backdrop-blur-[2px] md:p-5" role="dialog" aria-modal="true" aria-label="DigiKatha Voice Muse">
          <section className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-[#f7f7f4] shadow-2xl md:h-[calc(100vh-40px)] md:max-w-md md:rounded-[28px]">
            <header className="flex items-center justify-between border-b border-black/8 bg-[#20211f] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-[#d9f45f] text-black"><Sparkles size={18} /></span>
                <div><h2 className="font-semibold">Voice Muse</h2><p className="text-xs text-white/45">Speak. Reflect. Shape the story.</p></div>
              </div>
              <button onClick={close} aria-label="Close Voice Muse" className="grid size-9 place-items-center rounded-xl hover:bg-white/10"><X size={18} /></button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="rounded-2xl border border-black/8 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-black/35">Your thoughts</span>
                  {transcript && <button onClick={() => { setTranscript(""); setResult(null); }} className="text-xs text-black/40 hover:text-black">Clear</button>}
                </div>
                <textarea
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  placeholder="Your words will appear here. You can also type or edit before reflecting…"
                  className="min-h-32 w-full resize-none bg-transparent text-sm leading-6 outline-none"
                />
                {interim && <p className="mt-2 text-sm italic text-black/35">{interim}</p>}
              </div>

              <div className="flex flex-col items-center py-2">
                <button
                  onClick={listening ? stopListening : startListening}
                  className={`relative grid size-20 place-items-center rounded-full transition ${listening ? "bg-red-500 text-white shadow-[0_0_0_12px_rgba(239,68,68,.12)]" : "bg-[#20211f] text-white shadow-xl hover:scale-105"}`}
                  aria-label={listening ? "Stop listening" : "Start listening"}
                >
                  {listening ? <MicOff size={28} /> : <Mic size={28} />}
                  {listening && <span className="absolute inset-0 animate-ping rounded-full border border-red-400" />}
                </button>
                <p className="mt-4 text-sm font-medium">{listening ? "I’m listening…" : "Tap to speak"}</p>
                <p className="mt-1 text-center text-xs leading-5 text-black/40">Your browser asks for microphone access only when you tap. Browser dictation is free; unsupported browsers can use the optional Whisper fallback.</p>
              </div>

              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

              {(transcript || interim) && !result && (
                <Button onClick={reflect} disabled={thinking} className="w-full">
                  {thinking ? <><Loader2 className="animate-spin" size={16} />Reflecting on your words…</> : <><Sparkles size={16} />Reflect with DigiKatha</>}
                </Button>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#20211f] p-5 text-white">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#d9f45f]">DigiKatha reflects</span>
                      <button onClick={speaking ? stopSpeaking : () => speak(result.response)} aria-label={speaking ? "Stop speaking" : "Read response aloud"}>{speaking ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
                    </div>
                    <p className="text-sm leading-6 text-white/80">{result.response}</p>
                    <p className="mt-3 text-[10px] uppercase tracking-widest text-white/30">{result.mode === "ai" ? "AI literary analysis" : "Private local reflection"}</p>
                  </div>

                  {result.questions.length > 0 && <InsightBlock icon={<MessageCircleQuestion />} title="Questions to explore" items={result.questions} />}
                  {result.suggestions.length > 0 && <InsightBlock icon={<Lightbulb />} title="Ways to strengthen it" items={result.suggestions} />}

                  {result.manuscriptAddition && (
                    <div className="rounded-2xl border border-black/8 bg-white p-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-black/35">Draft for your chapter</span>
                      <p className="mt-3 max-h-44 overflow-y-auto font-serif text-sm leading-7 text-black/70">{result.manuscriptAddition}</p>
                      <Button onClick={insertDraft} className="mt-4 w-full"><Check size={16} />Add to chapter</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function InsightBlock({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold [&_svg]:size-4">{icon}{title}</div>
      <ul className="space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-sm leading-5 text-black/55"><span className="mt-2 size-1 shrink-0 rounded-full bg-black/30" />{item}</li>)}</ul>
    </div>
  );
}
