export function legalDocumentTitle(markdown: string) {
  const line = markdown.split(/\r?\n/, 1)[0] ?? ''
  if (!line.startsWith('# ')) {
    throw new Error('Legal markdown is missing an H1 title')
  }
  return line.slice(2).trim()
}
