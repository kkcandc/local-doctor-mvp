/*
  Serves dist the way Vercel does for this project, for testing the production build locally:
  a file if one exists, then <path>/index.html, then the SPA shell (vercel.json rewrite).
  Usage: node scripts/serve-dist.mjs [port]
*/
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const port = Number(process.argv[2] ?? 4173)

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

async function isFile(file) {
  try {
    return (await stat(file)).isFile()
  } catch {
    return false
  }
}

async function resolve(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '')
  const direct = path.join(dist, clean)
  if (!direct.startsWith(dist)) return path.join(dist, 'app-shell.html')
  if (await isFile(direct)) return direct
  const index = path.join(direct, 'index.html')
  if (await isFile(index)) return index
  return path.join(dist, 'app-shell.html')
}

createServer(async (req, res) => {
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
  // The Playwright env points PostHog here. Like the dev server, answer 404 instead of the SPA shell.
  if (pathname.startsWith('/__posthog/')) {
    res.writeHead(404).end()
    return
  }
  const file = await resolve(pathname)
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}).listen(port, '127.0.0.1', () => console.log(`Serving dist on http://127.0.0.1:${port}`))
