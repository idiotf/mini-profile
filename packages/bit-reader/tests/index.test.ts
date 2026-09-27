import { describe, it } from 'node:test'
import assert from 'assert'
import seedrandom from 'seedrandom'
import { BitReader } from '../src'

const testSeed = 'bit-reader test seed'

class TestDataGenerator {
  constructor(private prng = seedrandom(testSeed)) {}

  private randInt(min: number, max: number) {
    return min + Math.floor((max - min + 1) * this.prng())
  }

  generateRandomBits(byteLength = this.randInt(32, 1024)) {
    const bits = Array.from({ length: byteLength * 8 }, () =>
      this.randInt(0, 1),
    )
    const bytes = new Uint8Array(byteLength)
    for (let i = 0; i < bits.length; ++i) {
      const byteNumber = i >> 3
      bytes[byteNumber] = (bytes[byteNumber]! << 1) | bits[i]!
    }

    return { bits, bytes }
  }
}

const generator = new TestDataGenerator()

describe(`Bit Reader (seed: ${testSeed})`, () => {
  it('01. repeat reading 8 bits until end', () => {
    const { bits, bytes } = generator.generateRandomBits()
    const reader = new BitReader(bytes)
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      const expected = bits.slice(i, i + 8).reduce((acc, v) => (acc << 1) | v)
      const actual = reader.read(8)
      assert.deepStrictEqual(expected, actual)
    }
    assert.deepStrictEqual(reader.bitOffset, bits.length)
  })

  it('02. repeat reading 7 bits until end', () => {
    const { bits, bytes } = generator.generateRandomBits()
    const reader = new BitReader(bytes)
    for (let i = 0; i + 7 <= bits.length; i += 7) {
      const expected = bits.slice(i, i + 7).reduce((acc, v) => (acc << 1) | v)
      const actual = reader.read(7)
      assert.deepStrictEqual(expected, actual)
    }
    assert.deepStrictEqual(reader.bitOffset, 7 * Math.floor(bits.length / 7))
  })

  it('03. repeat reading 1 bit until end', () => {
    const { bits, bytes } = generator.generateRandomBits()
    const reader = new BitReader(bytes)
    for (let i = 0; i < bits.length; ++i) {
      const expected = bits[i]!
      const actual = reader.read(1)
      assert.deepStrictEqual(expected, actual)
    }
    assert.deepStrictEqual(reader.bitOffset, bits.length)
  })

  it('04. repeat reading 7 bits -> 1 bit -> 7 bits -> ...', () => {
    const { bits, bytes } = generator.generateRandomBits()
    const reader = new BitReader(bytes)
    for (let i = 0; i + 8 <= bits.length;) {
      {
        const expected = bits
          .slice(i, (i += 7))
          .reduce((acc, v) => (acc << 1) | v)
        const actual = reader.read(7)
        assert.deepStrictEqual(expected, actual)
      }
      {
        const expected = bits[i++]
        const actual = reader.read(1)
        assert.deepStrictEqual(expected, actual)
      }
    }
    assert.deepStrictEqual(reader.bitOffset, bits.length)
  })

  it('05. repeat reading 1 bits -> 7 bit -> 1 bits -> ...', () => {
    const { bits, bytes } = generator.generateRandomBits()
    const reader = new BitReader(bytes)
    for (let i = 0; i + 8 <= bits.length;) {
      {
        const expected = bits[i++]!
        const actual = reader.read(1)
        assert.deepStrictEqual(expected, actual)
      }
      {
        const expected = bits
          .slice(i, (i += 7))
          .reduce((acc, v) => (acc << 1) | v)
        const actual = reader.read(7)
        assert.deepStrictEqual(expected, actual)
      }
    }
    assert.deepStrictEqual(reader.bitOffset, bits.length)
  })

  it('06. bitOffset === bits.length, read 1 bits', () => {
    const { bits, bytes } = generator.generateRandomBits()
    const reader = new BitReader(bytes)
    assert.throws(() => {
      reader.bitOffset = bits.length
      reader.read(1)
    })
    assert.deepStrictEqual(reader.bitOffset, bits.length)
  })

  it('07. bitOffset === bits.length - 1, read 2 bits', () => {
    const { bits, bytes } = generator.generateRandomBits()
    const reader = new BitReader(bytes)
    assert.throws(() => {
      reader.bitOffset = bits.length - 1
      reader.read(2)
    })
    assert.deepStrictEqual(reader.bitOffset, bits.length - 1)
  })

  it('08. bitOffset === bits.length, skip 1 bits', () => {
    const { bits, bytes } = generator.generateRandomBits()
    const reader = new BitReader(bytes)
    assert.throws(() => {
      reader.bitOffset = bits.length
      reader.skip(1)
    })
    assert.deepStrictEqual(reader.bitOffset, bits.length)
  })

  it('09. bitOffset === bits.length - 1, skip 2 bits', () => {
    const { bits, bytes } = generator.generateRandomBits()
    const reader = new BitReader(bytes)
    assert.throws(() => {
      reader.bitOffset = bits.length - 1
      reader.skip(2)
    })
    assert.deepStrictEqual(reader.bitOffset, bits.length - 1)
  })

  it('10. skip 9 bits UVLC', () => {
    const bytes = new Uint8Array([0b0000_1_101, 0b0_0000000])
    const reader = new BitReader(bytes)
    reader.skipUvlc()
    assert.deepStrictEqual(reader.bitOffset, 9)
  })

  it('11. skip 7 bits UVLC', () => {
    const bytes = new Uint8Array([0b000_1_101_0])
    const reader = new BitReader(bytes)
    reader.skipUvlc()
    assert.deepStrictEqual(reader.bitOffset, 7)
  })

  it('12. skip 9 bits UVLC, leading zeros = 4', () => {
    const bytes = new Uint8Array([0b0000_1_101])
    const reader = new BitReader(bytes)
    assert.throws(() => {
      reader.skipUvlc()
    })
    assert.deepStrictEqual(reader.bitOffset, 0)
  })
})
