// Content here always comes from our own TipTap editor (RichTextEditor),
// whose schema only permits basic marks/nodes (bold, italic, lists,
// paragraphs) - it can't produce script tags or arbitrary HTML, so
// rendering it directly is safe for this internal tool.
export function RichTextView({ html }: { html: string }) {
  return <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: html }} />
}
