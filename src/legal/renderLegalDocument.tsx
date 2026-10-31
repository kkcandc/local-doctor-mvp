import { type ReactNode } from 'react'
import type { PhraseLink, TextReplacement } from './documentLinks'

const autoLinkSource =
  'https?:\\/\\/[^\\s<>)"\']+|www\\.[^\\s<>)"\']+|ocrportal\\.hhs\\.gov|cms\\.gov\\/nosurprises|(?<![A-Za-z0-9])hello@trylocaldoctor.com|1-800-368-1019|1-800-537-7697|1-800-985-3059'

function legalBlocks(markdown: string) {
  return markdown
    .replace(/^#[^\n]*\r?\n+/, '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function hrefForToken(token: string) {
  if (token.startsWith('hello@')) return `mailto:${token}`
  if (token.startsWith('www.')) return `https://${token}`
  if (token === 'ocrportal.hhs.gov') return 'https://ocrportal.hhs.gov'
  if (token === 'cms.gov/nosurprises') return 'https://cms.gov/nosurprises'
  if (token.startsWith('1-800-')) return `tel:+1${token.slice(2).replace(/-/g, '')}`
  return token
}

function trimTrailingPunctuation(token: string) {
  let core = token
  while (/[.,;:]$/.test(core)) core = core.slice(0, -1)
  return core
}

function paragraphClass(text: string) {
  if (
    text.startsWith('IMPORTANT:') ||
    text.startsWith('DISPUTE RESOLUTION NOTICE:') ||
    text.startsWith('PLEASE READ CAREFULLY.')
  ) {
    return 'legal-callout'
  }
  if (text.startsWith('This notice describes how medical information about you may be used and disclosed')) {
    return 'legal-notice'
  }
  if (text.startsWith('[PUBLICATION REQUIREMENT:')) return 'legal-publication-note'
  return undefined
}

function renderInline(text: string, phraseLinks: readonly PhraseLink[], keyPrefix: string): ReactNode[] {
  const phrases = [...phraseLinks].sort((left, right) => right.phrase.length - left.phrase.length)
  const autoLink = new RegExp(autoLinkSource, 'g')
  const nodes: ReactNode[] = []
  let index = 0
  let key = 0

  while (index < text.length) {
    let match: { at: number; length: number; label: string; href: string } | null = null

    for (const phrase of phrases) {
      const at = text.indexOf(phrase.phrase, index)
      if (at === -1) continue
      if (!match || at < match.at || (at === match.at && phrase.phrase.length > match.length)) {
        match = { at, length: phrase.phrase.length, label: phrase.phrase, href: phrase.href }
      }
    }

    autoLink.lastIndex = index
    const url = autoLink.exec(text)
    if (url && url.index >= index) {
      const label = trimTrailingPunctuation(url[0])
      if (!match || url.index < match.at || (url.index === match.at && label.length > match.length)) {
        match = { at: url.index, length: label.length, label, href: hrefForToken(label) }
      }
    }

    if (!match) {
      nodes.push(text.slice(index))
      break
    }

    if (match.at > index) nodes.push(text.slice(index, match.at))
    const external = /^https?:\/\//.test(match.href) && !match.href.includes('://trylocaldoctor.com')
    nodes.push(
      <a
        key={`${keyPrefix}-${key}`}
        href={match.href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {match.label}
      </a>,
    )
    key += 1
    index = match.at + match.length
  }

  return nodes
}

function renderParagraph(
  block: string,
  key: number,
  replacements: readonly TextReplacement[],
  phraseLinks: readonly PhraseLink[],
) {
  const replacement = replacements.find((item) => item.source === block)
  if (replacement) {
    return (
      <p key={`p-${key}`}>
        {replacement.prefix}
        <a href={replacement.href}>{replacement.label}</a>
      </p>
    )
  }

  const lines = block.split('\n')
  return (
    <p className={paragraphClass(block)} key={`p-${key}`}>
      {lines.map((line, lineIndex) => (
        <span key={`${key}-${lineIndex}`}>
          {lineIndex > 0 && <br />}
          {renderInline(line, phraseLinks, `p-${key}-${lineIndex}`)}
        </span>
      ))}
    </p>
  )
}

export function LegalDocument({
  markdown,
  headings,
  replacements = [],
  phraseLinks = [],
}: {
  markdown: string
  headings: readonly string[]
  replacements?: readonly TextReplacement[]
  phraseLinks?: readonly PhraseLink[]
}) {
  const blocks = legalBlocks(markdown)
  const headingSet = new Set(headings)
  const totals = new Map<string, number>()
  for (const block of blocks) {
    if (headingSet.has(block)) totals.set(block, (totals.get(block) ?? 0) + 1)
  }

  const seen = new Map<string, number>()
  const nodes: ReactNode[] = []
  let index = 0

  while (index < blocks.length) {
    const block = blocks[index]
    if (!headingSet.has(block)) {
      nodes.push(renderParagraph(block, index, replacements, phraseLinks))
      index += 1
      continue
    }

    const total = totals.get(block) ?? 1
    const nextSeen = (seen.get(block) ?? 0) + 1
    const isTocItem = total > 1 && nextSeen === 1

    if (isTocItem) {
      const items: Array<{ text: string; id: string }> = []
      while (index < blocks.length && headingSet.has(blocks[index])) {
        const item = blocks[index]
        const itemTotal = totals.get(item) ?? 1
        const itemSeen = (seen.get(item) ?? 0) + 1
        if (!(itemTotal > 1 && itemSeen === 1)) break
        seen.set(item, itemSeen)
        items.push({ text: item, id: slugifyHeading(item) })
        index += 1
      }
      nodes.push(
        <ul className="legal-toc" key={`toc-${index}`}>
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.text}</a>
            </li>
          ))}
        </ul>,
      )
      continue
    }

    seen.set(block, nextSeen)
    const contentIndex = total > 1 ? nextSeen - 1 : nextSeen
    const id = contentIndex === 1 ? slugifyHeading(block) : `${slugifyHeading(block)}-${contentIndex}`
    nodes.push(
      <h2 id={id} key={`h-${id}-${index}`}>
        {block}
      </h2>,
    )
    index += 1
  }

  return <div className="article-body">{nodes}</div>
}
