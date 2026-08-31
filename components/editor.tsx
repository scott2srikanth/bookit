"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, CloudOff, Sparkles } from "lucide-react";
import { wordCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VoiceAssistant } from "@/components/voice-assistant";

export function Editor({
  chapterId,
  chapterPosition,
  chapterTitle,
  initialContent,
  summary,
}: {
  chapterId: string;
  chapterPosition: number;
  chapterTitle: string;
  initialContent: string;
  summary: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const first = useRef(true);

  function toggleFocusMode() {
    setFocusMode((current) => !current);
  }

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
      {focusMode ? (
        <div className="flex items-center justify-between border-b border-black/8 px-4 py-2 sm:px-6">
          <p className="min-w-0 truncate text-xs font-medium text-black/45">{chapterTitle}</p>
          <button type="button" onClick={toggleFocusMode} className="ml-3 flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-black/55 hover:bg-black/5 hover:text-black" aria-label="Show chapter tools"><ChevronDown size={15} />Show tools</button>
        </div>
      ) : (
        <div className="border-b border-black/8">
          <div className="flex items-start justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
            <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-black/35">Chapter {chapterPosition}</p><h1 className="mt-1 truncate text-lg font-semibold tracking-[-.03em] sm:text-xl">{chapterTitle}</h1></div>
            <button type="button" onClick={toggleFocusMode} className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-black/45 hover:bg-black/5 hover:text-black" aria-label="Hide chapter tools"><ChevronUp size={15} />Hide tools</button>
          </div>
          <div className="flex flex-col gap-3 border-t border-black/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-2 text-xs text-black/45">
              {saved ? <><Check size={14} />Saved locally</> : <><CloudOff size={14} />Saving…</>}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <VoiceAssistant chapterId={chapterId} onInsert={appendToChapter} />
              <Button className="w-full" variant="outline" onClick={inspire}><Sparkles size={15} />Draft with AI</Button>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {!focusMode && <p className="mb-7 border-l-2 border-[#d9f45f] pl-4 text-sm italic leading-6 text-black/45">
          {summary || "Add a chapter summary to guide your writing."}
        </p>}
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          aria-label="Chapter manuscript"
          placeholder="Start writing your chapter…"
          className="min-h-[58vh] w-full resize-none bg-transparent font-serif text-[17px] leading-[1.8] text-[#292a27] outline-none sm:text-[18px] sm:leading-[1.95]"
        />
      </div>
      <div className="border-t border-black/8 px-6 py-3 text-right text-xs text-black/40">
        {wordCount(content).toLocaleString()} words
      </div>
    </div>
  );
}
