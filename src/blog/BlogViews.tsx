import { useEffect } from 'react'
import type { MouseEvent } from 'react'
import { blogPosts, getBlogPost } from './posts'

const defaultTitle = 'Local Doctor | Alzheimer\'s Treatment Eligibility Review'
const defaultDescription = 'Local Doctor is a virtual Alzheimer\'s specialty-care pilot for treatment eligibility review, records, testing, insurance preparation, and local follow-through for people who qualify.'

type Inline = { text: string; href?: string }

const linkPattern = /\[\[([^\]|]+)\|([^\]]+)\]\]/g

function isSafeHref(href: string) {
  if (href.startsWith('/') && !href.startsWith('//')) return true
  try {
    return new URL(href).protocol === 'https:'
  } catch {
    return false
  }
}

function parseInline(value: string): Inline[] {
  const parts: Inline[] = []
  let last = 0
  for (const match of value.matchAll(linkPattern)) {
    const index = match.index ?? 0
    if (index > last) parts.push({ text: value.slice(last, index) })
    const href = match[2].trim()
    parts.push(isSafeHref(href) ? { text: match[1], href } : { text: match[1] })
    last = index + match[0].length
  }
  if (last < value.length) parts.push({ text: value.slice(last) })
  return parts
}

function LinkedUrl({ href }: { href: string }) {
  const pieces = href.split(/(?<=\/)/)
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {pieces.map((piece, index) => (
        <span key={`${piece}-${index}`}>
          {piece}
          {index < pieces.length - 1 ? <wbr /> : null}
        </span>
      ))}
    </a>
  )
}

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`))
}

function RichText({
  value,
  onOpenPost,
  onGetStarted,
}: {
  value: string
  onOpenPost: (slug: string) => void
  onGetStarted: () => void
}) {
  return (
    <>
      {parseInline(value).map((part, index) => {
        if (!part.href) return <span key={index}>{part.text}</span>
        const external = part.href.startsWith('https://')
        return (
          <a
            key={index}
            href={part.href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            onClick={(event) => onInternalClick(event, part.href ?? '', onOpenPost, onGetStarted)}
          >
            {part.text}
          </a>
        )
      })}
    </>
  )
}

function onInternalClick(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
  onOpenPost: (slug: string) => void,
  onGetStarted: () => void,
) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  if (href === '/get-started') {
    event.preventDefault()
    onGetStarted()
    return
  }
  if (href === '/blog') {
    event.preventDefault()
    onOpenPost('')
    return
  }
  if (href.startsWith('/blog/')) {
    event.preventDefault()
    onOpenPost(decodeURIComponent(href.slice('/blog/'.length).replace(/\/+$/, '')))
  }
}

type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }

function blocksFrom(lines: string[]): Block[] {
  const blocks: Block[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (line.startsWith('### ')) {
      blocks.push({ kind: 'h3', text: line.slice(4) })
      index += 1
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push({ kind: 'h2', text: line.slice(3) })
      index += 1
      continue
    }
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (index < lines.length && lines[index].startsWith('- ')) {
        items.push(lines[index].slice(2))
        index += 1
      }
      blocks.push({ kind: 'ul', items })
      continue
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\.\s/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s/, ''))
        index += 1
      }
      blocks.push({ kind: 'ol', items })
      continue
    }
    blocks.push({ kind: 'p', text: line })
    index += 1
  }
  return blocks
}

function setCanonical(href: string | null) {
  const existing = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!href) {
    existing?.remove()
    return
  }
  const link = existing ?? document.createElement('link')
  link.rel = 'canonical'
  link.href = href
  if (!existing) document.head.appendChild(link)
}

function setDescription(content: string) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (meta) meta.content = content
}

function setJsonLd(data: Record<string, unknown> | null) {
  const existing = document.getElementById('blog-article-jsonld')
  if (!data) {
    existing?.remove()
    return
  }
  const script = existing ?? document.createElement('script')
  script.id = 'blog-article-jsonld'
  script.setAttribute('type', 'application/ld+json')
  script.textContent = JSON.stringify(data).replace(/</g, '\\u003c')
  if (!existing) document.head.appendChild(script)
}

export function BlogIndex({
  onOpenPost,
}: {
  onOpenPost: (slug: string) => void
}) {
  useEffect(() => {
    document.title = 'Blog | Local Doctor'
    setDescription('Articles on Alzheimer\'s treatment, eligibility, cost, and brain health, republished from Local Infusion with attribution.')
    setCanonical(null)
    setJsonLd(null)
    return () => {
      document.title = defaultTitle
      setDescription(defaultDescription)
    }
  }, [])

  return (
    <>
      <section className="page-hero">
        <div>
          <p className="eyebrow">Blog</p>
          <h1>Straight answers on diagnosis, eligibility, and treatment.</h1>
          <p>These articles were originally published by Local Infusion. Each one links back to the original and keeps the author credit.</p>
        </div>
        <aside>
          <strong>Clinical decisions require licensed review.</strong>
          <span>The website is a front door, not a diagnosis or treatment promise.</span>
        </aside>
      </section>
      <section className="section white">
        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article className="blog-card" key={post.slug}>
              <span>{post.label}</span>
              <h2>
                <a href={`/blog/${post.slug}`} onClick={(event) => onInternalClick(event, `/blog/${post.slug}`, onOpenPost, () => undefined)}>
                  {post.title}
                </a>
              </h2>
              <p className="blog-meta">{formatDate(post.published)} · {post.author}</p>
              <p>{post.excerpt}</p>
              <p className="blog-attribution">
                Originally published by Local Infusion.{' '}
                <LinkedUrl href={post.canonicalUrl} />
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

export function BlogArticle({
  slug,
  onOpenPost,
  onGetStarted,
}: {
  slug: string
  onOpenPost: (slug: string) => void
  onGetStarted: () => void
}) {
  const post = getBlogPost(slug)

  useEffect(() => {
    if (!post) {
      document.title = 'Article not found | Local Doctor'
      setDescription(defaultDescription)
      setCanonical(null)
      setJsonLd(null)
      return () => {
        document.title = defaultTitle
        setDescription(defaultDescription)
      }
    }

    document.title = `${post.title} | Local Doctor`
    setDescription(post.excerpt)
    setCanonical(post.canonicalUrl)
    setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.published,
      dateModified: post.updated,
      author: {
        '@type': 'Person',
        name: post.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Local Infusion',
        url: 'https://mylocalinfusion.com/',
      },
      isBasedOn: post.canonicalUrl,
      sameAs: post.canonicalUrl,
      mainEntityOfPage: post.canonicalUrl,
    })

    return () => {
      document.title = defaultTitle
      setDescription(defaultDescription)
      setCanonical(null)
      setJsonLd(null)
    }
  }, [post])

  if (!post) {
    return (
      <section className="section white">
        <div className="article-shell">
          <p className="eyebrow">Blog</p>
          <h1>Article not found</h1>
          <p>That link does not match an article on this site.</p>
          <a href="/blog" onClick={(event) => onInternalClick(event, '/blog', onOpenPost, onGetStarted)}>Back to the blog</a>
        </div>
      </section>
    )
  }

  const blocks = blocksFrom(post.blocks)

  return (
    <article className="section white blog-article">
      <div className="article-shell">
        <p className="eyebrow">{post.label}</p>
        <h1>{post.title}</h1>
        <p className="blog-meta">
          By {post.author} · Published {formatDate(post.published)}
          {post.updated !== post.published ? ` · Updated ${formatDate(post.updated)}` : ''}
        </p>
        <aside className="syndication-credit">
          <p>
            Originally published by <a href="https://mylocalinfusion.com/" target="_blank" rel="noopener noreferrer">Local Infusion</a>.
            Author: {post.author}.
          </p>
          <p>
            Original article:{' '}
            <LinkedUrl href={post.canonicalUrl} />
          </p>
        </aside>
        <p className="blog-note">
          Republished here for education, as published by Local Infusion. Drug labels, prices, and availability can change after the original date. This page does not diagnose, prescribe, or promise eligibility or coverage. Talk with a licensed clinician before any care decision.
        </p>
        {blocks.map((block, index) => {
          if (block.kind === 'h2') return <h2 key={index}><RichText value={block.text} onOpenPost={onOpenPost} onGetStarted={onGetStarted} /></h2>
          if (block.kind === 'h3') return <h3 key={index}><RichText value={block.text} onOpenPost={onOpenPost} onGetStarted={onGetStarted} /></h3>
          if (block.kind === 'ul' || block.kind === 'ol') {
            const List = block.kind
            return (
              <List key={index}>
                {block.items.map((item) => (
                  <li key={item}><RichText value={item} onOpenPost={onOpenPost} onGetStarted={onGetStarted} /></li>
                ))}
              </List>
            )
          }
          return <p key={index}><RichText value={block.text} onOpenPost={onOpenPost} onGetStarted={onGetStarted} /></p>
        })}
        <p className="blog-back">
          <a href="/blog" onClick={(event) => onInternalClick(event, '/blog', onOpenPost, onGetStarted)}>All articles</a>
        </p>
      </div>
    </article>
  )
}
