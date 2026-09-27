export class BitReader {
  bitOffset = 0

  constructor(public data: Uint8Array) {}

  skip(bits: number) {
    if (this.bitOffset + bits > this.data.length * 8) {
      throw RangeError('Truncated bitstream')
    }
    this.bitOffset += bits
  }

  /**
   * @alias readNumber
   */
  read(bits: number) {
    return this.readNumber(bits)
  }

  readBool() {
    return !!this.read(1)
  }

  readNumber(bits: number) {
    if (!Number.isInteger(bits) || bits < 1) {
      throw TypeError('bits must be a natural number')
    }

    const startBitOffset = this.bitOffset
    const startByte = startBitOffset >> 3
    const startBit = startBitOffset & 7

    const endBitOffset = this.bitOffset + bits
    const endByte = endBitOffset >> 3
    const endBit = endBitOffset & 7

    const data = this.data
    let num = data[startByte]! & (255 >> startBit)

    const startOffset = startByte + 1
    const endOffset = endByte + (endBit ? 1 : 0)

    const len = data.byteLength
    if (endOffset > len) {
      throw RangeError('Truncated bitstream')
    }

    this.bitOffset += bits
    for (let i = startOffset; i < endOffset; ++i) {
      num = (num << 8) | data[i]!
    }
    return num >> ((8 - endBit) & 7)
  }

  skipUvlc() {
    const originOffset = this.bitOffset
    try {
      let zeros = 0
      while (!this.read(1)) {
        zeros += 1
      }
      this.skip(zeros)
    } catch (e) {
      this.bitOffset = originOffset
      throw e
    }
  }
}
