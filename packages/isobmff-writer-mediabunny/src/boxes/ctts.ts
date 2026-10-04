import { FullBox } from '../box-base'
import { isIntOrBigInt, isU32 } from '../utils'

export interface CttsEntry {
  sampleCount: number
  sampleOffset: number
}

export class Ctts extends FullBox {
  constructor(entries: CttsEntry[]) {
    const data = new Uint8Array(4 + entries.length * 8)
    const view = new DataView(data.buffer)
    view.setUint32(0, entries.length)

    let version: 0 | 1 = 1
    let i = 0,
      offset = 4,
      hasNegativeOffset = false
    for (; i < entries.length; ++i, offset += 4) {
      const { sampleCount, sampleOffset } = entries[i]!

      if (0x7fff_ffff < sampleOffset) {
        if (hasNegativeOffset) {
          throw TypeError(
            'The sample_offset of ctts cannot be mixed with u32 and i32',
          )
        }

        version = 0
        do {
          const { sampleCount, sampleOffset } = entries[i]!

          if (!isU32(sampleCount)) {
            throw TypeError(
              'The sample_count of ctts must have type of u32; received ' +
                sampleCount,
            )
          }

          if (
            !isIntOrBigInt(sampleOffset) ||
            sampleOffset < -0x8000_0000 ||
            0xffff_ffff < sampleOffset
          ) {
            throw TypeError(
              'The sample_offset of ctts must have type of u32 or i32; received ' +
                sampleOffset,
            )
          }

          if (sampleOffset < 0) {
            throw TypeError(
              'The sample_offset of ctts cannot be mixed with u32 and i32',
            )
          }

          view.setUint32(offset, sampleOffset)
          offset += 4
        } while (++i < entries.length)
        break
      }

      if (!isU32(sampleCount)) {
        throw TypeError(
          'The sample_count of ctts must have type of u32; received ' +
            sampleCount,
        )
      }

      if (
        !isIntOrBigInt(sampleOffset) ||
        sampleOffset < -0x8000_0000 ||
        0xffff_ffff < sampleOffset
      ) {
        throw TypeError(
          'The sample_offset of ctts must have type of u32 or i32; received ' +
            sampleOffset,
        )
      }

      view.setInt32(offset, sampleOffset)
      hasNegativeOffset ||= sampleOffset < 0
    }

    super('ctts', version, 0, data)
  }
}

export function ctts(entries: CttsEntry[]) {
  return new Ctts(entries)
}
