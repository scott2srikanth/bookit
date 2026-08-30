"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CloudOff, Sparkles } from "lucide-react";
import { wordCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VoiceAssistant } from "@/components/voice-assistant";

export function Editor({
  chapterId,
  initialContent,
  summary,
}: {
  chapterId: string;
  initialContent: string;
  summary: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(true);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved(false);
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/chapters/${chapterId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setSaved(response.ok);
    }, 700);
    return () => clearTimeout(timer);
  }, [content, chapterId]);

  async function inspire() {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chapterId }),
    });
    if (!response.ok) return;
    const data = await response.json();
    appendToChapter(data.text);
  }

  function appendToChapter(text: string) {
    setContent((current) => current + (current.trim() ? "\n\n" : "") + text.trim());
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/8 px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-black/45">
          {saved ? <><Check size={14} />Saved locally</> : <><CloudOff size={14} />Saving…</>}
        </div>
        <div className="flex items-center gap-2">
          <VoiceAssistant chapterId={chapterId} onInsert={appendToChapter} />
          <Button variant="outline" onClick={inspire}><Sparkles size={15} />Draft with AI</Button>
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <p className="mb-7 border-l-2 border-[#d9f45f] pl-4 text-sm italic leading-6 text-black/45">
          {summary || "Add a chapter summary to guide your writing."}
        </p>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          aria-label="Chapter manuscript"
          placeholder="Start writing your chapter…"
          className="min-h-[58vh] w-full resize-none bg-transparent font-serif text-[18px] leading-[1.95] text-[#292a27] outline-none"
        />
      </div>
      <div className="border-t border-black/8 px-6 py-3 text-right text-xs text-black/40">
        {wordCount(content).toLocaleString()} words
      </div>
    </div>
  );
}
