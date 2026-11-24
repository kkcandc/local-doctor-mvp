import { expect, test } from '@playwright/test'
import middleware, { config } from '../middleware'
import { LP_SPLIT_PATHS, decideSplit, pickVariant, readLpCookie } from '../src/lp/split'

/*
  The Evaluation landing page split (src/lp/split.ts and middleware.ts). Pure checks, no browser.
  tests-prerender/lp-split.spec.ts runs the same middleware against the built pages.
*/

const human = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

function run(path: string, init: { cookie?: string; ua?: string } = {}) {
  const headers = new Headers({ 'user-agent': init.ua ?? human })
  if (init.cookie) headers.set('cookie', init.cookie)
  return middleware(new Request(`https://trylocaldoctor.com${path}`, { headers }))
}

test('matcher covers exactly the split paths', () => {
  expect([...config.matcher].sort()).toEqual([...LP_SPLIT_PATHS].sort())
  expect(config.matcher).not.toContain('/alzheimers-second-opinion')
})

test('assignment is weighted 34/33/33 and always returns a variant', () => {
  expect(pickVariant(0)).toBe('a')
  expect(pickVariant(0.339)).toBe('a')
  expect(pickVariant(0.341)).toBe('b')
  expect(pickVariant(0.669)).toBe('b')
  expect(pickVariant(0.671)).toBe('c')
  expect(pickVariant(0.9999)).toBe('c')
  const counts = { a: 0, b: 0, c: 0 }
  const n = 30000
  for (let i = 0; i < n; i += 1) counts[pickVariant((i + 0.5) / n)] += 1
  expect(Math.abs(counts.a / n - 0.34)).toBeLessThan(0.002)
  expect(Math.abs(counts.b / n - 0.33)).toBeLessThan(0.002)
  expect(Math.abs(counts.c / n - 0.33)).toBeLessThan(0.002)
})

test('an Evaluation ad click is assigned, rewritten, and given the cookie', () => {
  for (const id of ['gclid=abc', 'gbraid=abc', 'wbraid=abc', 'utm_campaign=24437868716', 'utm_campaign=24533466183&gclid=x']) {
    const response = run(`/dementia-evaluation?${id}&utm_source=google`)
    const rewrite = response.headers.get('x-middleware-rewrite') ?? ''
    expect(rewrite, id).toMatch(/^https:\/\/trylocaldoctor\.com\/lp\/[abc]\?/)
    expect(rewrite, 'query string kept').toContain(id.split('&')[0])
    expect(rewrite).toContain('utm_source=google')
    const cookie = response.headers.get('set-cookie') ?? ''
    expect(cookie).toMatch(/^ld_lp=[abc]; Path=\/; Max-Age=2592000; SameSite=Lax; Secure$/)
    expect(cookie.slice(6, 7)).toBe(rewrite.match(/\/lp\/([abc])/)![1])
    expect(response.headers.get('x-robots-tag')).toBe('noindex')
    expect(response.headers.get('cache-control')).toBe('private, no-cache')
  }
})

test('a returning visitor keeps the same variant (sticky cookie)', () => {
  for (const variant of ['a', 'b', 'c']) {
    for (const path of ['/dementia-evaluation?gclid=new', '/memory-evaluation', '/alzheimers-evaluation/']) {
      const response = run(path, { cookie: `other=1; ld_lp=${variant}` })
      expect(response.headers.get('x-middleware-rewrite'), path).toContain(`/lp/${variant}`)
      expect(response.headers.get('set-cookie')).toBeNull()
    }
  }
  expect(readLpCookie('ld_lp=z')).toBeNull()
  expect(decideSplit({ pathname: '/dementia-evaluation', search: '?gclid=1', cookieHeader: 'ld_lp=z', userAgent: human, random: 0.5 }).reason).toBe('assigned')
})

test('?lp= override serves that variant for anyone without touching the cookie', () => {
  for (const variant of ['a', 'b', 'c']) {
    const response = run(`/dementia-evaluation?lp=${variant}`, { cookie: 'ld_lp=a', ua: 'Googlebot/2.1' })
    expect(response.headers.get('x-middleware-rewrite')).toContain(`/lp/${variant}?lp=${variant}`)
    expect(response.headers.get('set-cookie')).toBeNull()
  }
  const original = run('/dementia-evaluation?lp=original&gclid=1', { cookie: 'ld_lp=b' })
  expect(original.headers.get('x-middleware-next')).toBe('1')
  expect(original.headers.get('x-middleware-rewrite')).toBeNull()
  expect(original.headers.get('set-cookie')).toMatch(/^ld_lp=; .*Max-Age=0/)
})

test('organic visitors, crawlers, and other campaigns see the normal page', () => {
  const untouched = [
    run('/dementia-evaluation'),
    run('/dementia-evaluation?utm_source=newsletter'),
    run('/dementia-evaluation?gclid=abc', { ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }),
    run('/dementia-evaluation?gclid=abc', { ua: 'AdsBot-Google (+http://www.google.com/adsbot.html)' }),
    run('/dementia-evaluation?gclid=abc', { ua: 'Mozilla/5.0 (Linux; Android 11) Chrome-Lighthouse' }),
    run('/dementia-evaluation?gclid=abc', { ua: 'Mozilla/5.0 (compatible; bingbot/2.0)' }),
    run('/dementia-evaluation?gclid=abc&utm_campaign=24437868713'),
    run('/dementia-evaluation?utm_campaign=24437868713', { cookie: 'ld_lp=b' }),
  ]
  for (const response of untouched) {
    expect(response.headers.get('x-middleware-next')).toBe('1')
    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
    expect(response.headers.get('set-cookie')).toBeNull()
  }
})

test('non-Evaluation pages are never split', () => {
  for (const path of ['/', '/memory-doctor-near-me', '/alzheimers-doctor-maryland', '/alzheimers-doctor-virginia', '/memory-specialist-maryland', '/alzheimers-second-opinion', '/get-started', '/lp/b']) {
    const decision = decideSplit({ pathname: path, search: '?gclid=abc&utm_campaign=24437868716', cookieHeader: 'ld_lp=c', userAgent: human, random: 0.5 })
    expect(decision, path).toEqual({ variant: null, reason: 'not_split_path' })
  }
})
