/*
  Runs after `vite build` (client) and `vite build --ssr` (server). Renders every public route to
  static HTML so the first response has the page content, H1, title, description, and canonical
  before any JavaScript runs. The client bundle then hydrates that HTML (src/main.tsx).

  dist/index.html becomes the prerendered home page. The original empty shell is kept as
  dist/app-shell.html, which vercel.json serves for any path that has no prerendered file.
*/
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const serverEntry = path.join(root, 'dist-server', 'entry-server.js')
const manifestPath = path.join(dist, '.vite', 'manifest.json')

const { earlyClickScript, prerenderAll, staticPageHtml } = await import(pathToFileURL(serverEntry).href)
const shell = await readFile(path.join(dist, 'index.html'), 'utf8')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

if (!shell.includes('<div id="root"></div>')) throw new Error('dist/index.html has no empty #root to fill')

// modulepreload and stylesheet tags for a lazy route chunk, so its CSS is there on first paint
// and its JS downloads in parallel with the main bundle instead of after it.
function chunkTags(source) {
  const entry = manifest[source]
  if (!entry) throw new Error(`${source} is not in the Vite manifest`)
  const seen = new Set()
  const js = []
  const css = []
  const visit = (key) => {
    const chunk = manifest[key]
    // The entry chunk and its CSS are already in index.html.
    if (seen.has(key) || chunk.isEntry) return
    seen.add(key)
    js.push(chunk.file)
    for (const file of chunk.css ?? []) css.push(file)
    for (const imported of chunk.imports ?? []) visit(imported)
  }
  visit(source)
  return [
    ...css.map((file) => `    <link rel="stylesheet" crossorigin href="/${file}">\n`),
    ...js.map((file) => `    <link rel="modulepreload" crossorigin href="/${file}">\n`),
  ].join('')
}

// React emits image preload hints ahead of the markup. They are moved out of #root, and only the
// fetchPriority="high" hero images keep one: the rest (logos, footer) load as they do today.
function splitHoisted(html) {
  const match = html.match(/^(?:<link\b[^>]*\/?>)+/)
  if (!match) return { hoisted: '', body: html }
  const hoisted = (match[0].match(/<link\b[^>]*?\/?>/g) ?? [])
    .filter((tag) => /fetchPriority="high"/i.test(tag))
    .map((tag) => `    ${tag.replace(/\s*\/?>$/, '>')}\n`)
    .join('')
  return { hoisted, body: html.slice(match[0].length) }
}

await writeFile(path.join(dist, 'app-shell.html'), shell)

const pages = await prerenderAll()
for (const page of pages) {
  const { hoisted, body } = splitHoisted(page.html)
  const extraHead = hoisted + (page.lazySource ? chunkTags(page.lazySource) : '')
  const html = staticPageHtml(shell, page.head, extraHead).replace(
    '<div id="root"></div>',
    () => `<div id="root">${body}</div>\n    <script>${earlyClickScript()}</script>`,
  )
  const file = page.path === '/' ? path.join(dist, 'index.html') : path.join(dist, page.path.slice(1), 'index.html')
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, html)
}

await rm(path.join(dist, '.vite'), { recursive: true, force: true })
console.log(`Prerendered ${pages.length} routes:\n${pages.map((page) => `  ${page.path}`).join('\n')}`)
