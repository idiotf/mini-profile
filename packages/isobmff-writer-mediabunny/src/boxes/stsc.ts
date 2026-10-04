import { FullBox } from '../box-base'
import { isU32 } from '../utils'

export interface StscEntry {
  firstChunk: number
  samplesPerChunk: number
  sampleDescriptionIndex: number
}

export class Stsc extends FullBox {
  constructor(entries: StscEntry[]) {
    const data = new Uint8Array(4 + entries.length * 12)
    const view = new DataView(data.buffer)

    function setU32(num: number) {
      view.setUint32(offset, num)
      offset += 4
    }

    let offset = 0

    setU32(entries.length)
    for (const entry of entries) {
      if (!isU32(entry.firstChunk)) {
        throw TypeError(
          'The first_chunk of stsc must have type of u32; received ' +
            entry.firstChunk,
        )
      }

      if (!isU32(entry.samplesPerChunk)) {
        throw TypeError(
          'The samples_per_chunk of stsc must have type of u32; received ' +
            entry.samplesPerChunk,
        )
      }

      if (!isU32(entry.sampleDescriptionIndex)) {
        throw TypeError(
          'The sample_description_index of stsc must have type of u32; received ' +
            entry.sampleDescriptionIndex,
        )
      }

      setU32(entry.firstChunk)
      setU32(entry.samplesPerChunk)
      setU32(entry.sampleDescriptionIndex)
    }

    super('stsc', 0, 0, data)
  }
}

export function stsc(entries: StscEntry[]) {
  return new Stsc(entries)
}
