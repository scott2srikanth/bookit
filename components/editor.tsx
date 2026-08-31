"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, CloudOff, Sparkles } from "lucide-react";
import { wordCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VoiceAssistant } from "@/components/voice-assistant";

function formatManuscript(value: string) {
  const sections = value
    .replace(/\r\n?/g, "\n")
    .replace(/\s*\*\*([^*\n]{1,80})\*\*\s*/g, "\n\n$1\n\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/^[\t ]+/, "").trim())
    .filter(Boolean);

  return sections
    .flatMap((paragraph) => {
      if (paragraph.length < 520) return [paragraph];
      const sentences = paragraph.match(/[^.!?।]+[.!?।]+(?:["'’”)\]]+)?|[^.!?।]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [paragraph];
      const groups: string[] = [];
      let group = "";
      for (const sentence of sentences) {
        group = `${group} ${sentence}`.trim();
        if (group.length >= 360) {
          groups.push(group);
          group = "";
        }
      }
      if (group) groups.push(group);
      return groups;
    })
    .map((paragraph) => `\t${paragraph}`)
    .join("\n\n");
}

export function Editor({
  chapterId,
  bookId,
  initialLanguage,
  chapterPosition,
  chapterTitle,
  initialContent,
  summary,
}: {
  chapterId: string;
  bookId: string;
  initialLanguage: string;
  chapterPosition: number;
  chapterTitle: string;
  initialContent: string;
  summary: string;
}) {
  const [content, setContent] = useState(() => formatManuscript(initialContent));
  const [saved, setSaved] = useState(true);
  const [language, setLanguage] = useState(initialLanguage);
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

  async function changeLanguage(nextLanguage: string) {
    const previous = language;
    setLanguage(nextLanguage);
    const response = await fetch(`/api/books/${bookId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ language: nextLanguage }),
    });
    if (!response.ok) setLanguage(previous);
  }

  function appendToChapter(text: string) {
    setContent((current) => formatManuscript(current + (current.trim() ? "\n\n" : "") + text.trim()));
  }

  function handleManuscriptKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    const field = event.currentTarget;
    if (field.selectionStart === 0 || field.value[field.selectionStart - 1] !== "\n") return;
    event.preventDefault();
    field.setRangeText("\n\t", field.selectionStart, field.selectionEnd, "end");
    setContent(field.value);
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
              <label className="col-span-2 sm:col-span-1"><span className="sr-only">Writing language</span><select value={language} onChange={(event) => changeLanguage(event.target.value)} className="h-9 w-full rounded-md border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30" aria-label="Writing language"><option>English</option><option>Hindi</option><option>Telugu</option></select></label>
              <VoiceAssistant chapterId={chapterId} language={language} onInsert={appendToChapter} />
              <Button className="w-full" variant="outline" onClick={inspire}><Sparkles size={15} />Draft with AI</Button>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto w-full max-w-[46rem] flex-1 px-4 py-6 sm:px-8 sm:py-10">
        {!focusMode && <p className="mb-7 border-l-2 border-[#d9f45f] pl-4 text-sm italic leading-6 text-black/45">
          {summary || "Add a chapter summary to guide your writing."}
        </p>}
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onBlur={(event) => setContent(formatManuscript(event.target.value))}
          onKeyDown={handleManuscriptKeyDown}
          aria-label="Chapter manuscript"
          placeholder="Start writing your chapter…"
          spellCheck
          lang={language === "Hindi" ? "hi" : language === "Telugu" ? "te" : "en"}
          className={`manuscript-editor min-h-[58vh] w-full resize-none whitespace-pre-wrap bg-transparent text-[18px] leading-[1.85] tracking-[.006em] text-[#292a27] [tab-size:2] outline-none sm:text-[19px] sm:leading-[1.9] sm:[tab-size:3] ${language === "Hindi" ? "manuscript-hindi" : language === "Telugu" ? "manuscript-telugu" : "manuscript-english"}`}
        />
      </div>
      <div className="border-t border-black/8 px-6 py-3 text-right text-xs text-black/40">
        {wordCount(content).toLocaleString()} words
      </div>
    </div>
  );
}
