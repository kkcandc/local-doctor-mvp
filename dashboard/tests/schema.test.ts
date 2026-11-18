import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import schema from '../schema/snapshot.schema.json'
import fixture from '../fixtures/example-snapshot.json'

describe('snapshot schema', () => {
  it('validates the example fixture', () => {
    const ajv = new Ajv2020({ allErrors: true, strict: false })
    addFormats(ajv)
    const validate = ajv.compile(schema)
    const ok = validate(fixture)
    expect(validate.errors ?? []).toEqual([])
    expect(ok).toBe(true)
  })
})
