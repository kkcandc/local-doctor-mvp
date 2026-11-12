// Fails if an em dash (U+2014) or en dash (U+2013) appears in any dashboard source or doc file.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const skip = new Set(['node_modules', '.next', '.data', '.vercel'])
const banned = /[\u2013\u2014]/
const hits = []

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) walk(full)
    else if (/\.(ts|tsx|mjs|js|json|css|md|svg|example)$/.test(name) || name.startsWith('.env')) {
      readFileSync(full, 'utf8')
        .split('\n')
        .forEach((line, i) => banned.test(line) && hits.push(`${path.relative(root, full)}:${i + 1}`))
    }
  }
}

walk(root)
if (hits.length) {
  console.error(`Dashes not allowed (use a comma, colon, parentheses or a plain hyphen):\n${hits.join('\n')}`)
  process.exit(1)
}
console.log('Copy check passed: no em or en dashes.')
