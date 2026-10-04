import { FullBox } from '../box-base'
import { isU64 } from '../utils'

export class Co64 extends FullBox {
  constructor(chunkOffsets: (number | bigint)[]) {
    const data = new Uint8Array(4 + chunkOffsets.length * 8)
    const view = new DataView(data.buffer)

    function setU32(num: number) {
      view.setUint32(offset, num)
      offset += 4
    }

    function setU64(num: number | bigint) {
      view.setBigUint64(offset, BigInt(num))
      offset += 8
    }

    let offset = 0

    setU32(chunkOffsets.length)
    for (const offset of chunkOffsets) {
      if (!isU64(offset)) {
        throw TypeError(
          'The chunk_offset of co64 must have type of u64; received ' + offset,
        )
      }

      setU64(offset)
    }

    super('co64', 0, 0, data)
  }
}

export function co64(chunkOffsets: (number | bigint)[]) {
  return new Co64(chunkOffsets)
}
