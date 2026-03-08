export function renderMarkdown(md: string): string {
  if (!md) return ''
  const lines = md.split('\n')
  const out: string[] = []
  let inList = false

  for (const line of lines) {
    if (inList && !line.match(/^[-*•]\s/)) { out.push('</ul>'); inList = false }
    if      (line.startsWith('### ')) { out.push(`<h3>${fmt(line.slice(4))}</h3>`); continue }
    else if (line.startsWith('## '))  { out.push(`<h2>${fmt(line.slice(3))}</h2>`); continue }
    else if (line.startsWith('# '))   { out.push(`<h1>${fmt(line.slice(2))}</h1>`); continue }
    else if (line.match(/^[-*•]\s/))  { if (!inList) { out.push('<ul>'); inList = true } out.push(`<li>${fmt(line.slice(2))}</li>`); continue }
    else if (line.match(/^---+$/))    { out.push('<hr/>'); continue }
    else if (!line.trim())            { out.push('<br/>'); continue }
    else                              { out.push(`<p>${fmt(line)}</p>`) }
  }
  if (inList) out.push('</ul>')
  return out.join('\n')
}

function fmt(t: string) {
  return t
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#C084FC">$1</a>')
    .replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>')
}
