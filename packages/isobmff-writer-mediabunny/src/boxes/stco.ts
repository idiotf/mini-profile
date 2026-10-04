import { FullBox } from '../box-base'
import { isU32 } from '../utils'

export class Stco extends FullBox {
  constructor(chunkOffsets: number[]) {
    const data = new Uint8Array(4 + chunkOffsets.length * 4)
    const view = new DataView(data.buffer)

    function setU32(num: number) {
      view.setUint32(offset, num)
      offset += 4
    }

    let offset = 0

    setU32(chunkOffsets.length)
    for (const offset of chunkOffsets) {
      if (!isU32(offset)) {
        throw TypeError(
          'The chunk_offset of stco must have type of u32; received ' + offset,
        )
      }

      setU32(offset)
    }

    super('stco', 0, 0, data)
  }
}

export function stco(chunkOffsets: number[]) {
  return new Stco(chunkOffsets)
}
