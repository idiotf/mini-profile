import { FullBox } from '../box-base'
import { isU32 } from '../utils'

export interface SttsEntry {
  sampleCount: number
  sampleDelta: number
}

export class Stts extends FullBox {
  constructor(entries: SttsEntry[]) {
    const data = new Uint8Array(4 + entries.length * 8)
    const view = new DataView(data.buffer)

    function setU32(num: number) {
      view.setUint32(offset, num)
      offset += 4
    }

    let offset = 0

    setU32(entries.length)
    for (const { sampleCount, sampleDelta } of entries) {
      if (!isU32(sampleCount)) {
        throw TypeError(
          'The sample_count of stts must have type of u32; received ' +
            sampleCount,
        )
      }

      if (!isU32(sampleDelta)) {
        throw TypeError(
          'The sample_delta of stts must have type of u32; received ' +
            sampleDelta,
        )
      }

      setU32(sampleCount)
      setU32(sampleDelta)
    }

    super('stts', 0, 0, data)
  }
}

export function stts(entries: SttsEntry[]) {
  return new Stts(entries)
}
