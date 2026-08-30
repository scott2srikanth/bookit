import { db } from "@/lib/db";
import { books, chapters } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import JSZip from "jszip";
import { authorizeApi } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const denied = await authorizeApi(req, false);
  if (denied) return denied;
  const { bookId } = await params;
  const format = new URL(req.url).searchParams.get("format");
  const book = (await db.select().from(books).where(eq(books.id, bookId)))[0];
  if (!book) return new Response("Not found", { status: 404 });
  const list = await db.select().from(chapters).where(eq(chapters.bookId, bookId)).orderBy(asc(chapters.position));
  const safe = book.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "book";

  if (format === "docx") {
    const children = [
      new Paragraph({ text: book.title, heading: HeadingLevel.TITLE }),
      ...(book.subtitle ? [new Paragraph({ children: [new TextRun({ text: book.subtitle, italics: true })] })] : []),
      ...list.flatMap((chapter) => [
        new Paragraph({ text: chapter.title, heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
        ...chapter.content.split(/\n\n+/).filter(Boolean).map((text) =>
          new Paragraph({ children: [new TextRun(text)], spacing: { after: 220 }, indent: { firstLine: 360 } })
        ),
      ]),
    ];
    const data = await Packer.toBuffer(new Document({ sections: [{ properties: {}, children }] }));
    return new Response(new Blob([new Uint8Array(data)]), { headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": `attachment; filename="${safe}.docx"`,
    }});
  }

  const esc = (value: string) => value.replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]!));
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file("META-INF/container.xml", `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);
  const ids = list.map((_, i) => `c${i + 1}`);
  list.forEach((chapter, i) => zip.file(`OEBPS/${ids[i]}.xhtml`, `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${esc(chapter.title)}</title><link rel="stylesheet" href="style.css" type="text/css"/></head><body><h1>${esc(chapter.title)}</h1>${chapter.content.split(/\n\n+/).map((text) => `<p>${esc(text)}</p>`).join("")}</body></html>`));
  zip.file("OEBPS/style.css", "body{font-family:serif;line-height:1.65;margin:8%;}h1{page-break-before:always;}p{text-indent:1.5em;margin:.4em 0;}");
  zip.file("OEBPS/content.opf", `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="uid">${book.id}</dc:identifier><dc:title>${esc(book.title)}</dc:title><dc:language>en</dc:language></metadata><manifest>${ids.map((id) => `<item id="${id}" href="${id}.xhtml" media-type="application/xhtml+xml"/>`).join("")}<item id="css" href="style.css" media-type="text/css"/></manifest><spine>${ids.map((id) => `<itemref idref="${id}"/>`).join("")}</spine></package>`);
  const data = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  return new Response(new Blob([data as BlobPart]), { headers: {
    "content-type": "application/epub+zip",
    "content-disposition": `attachment; filename="${safe}.epub"`,
  }});
}
