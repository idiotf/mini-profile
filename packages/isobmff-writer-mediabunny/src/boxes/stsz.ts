import { FullBox } from '../box-base'
import { isU32 } from '../utils'

export class Stsz extends FullBox {
  constructor(sizes: number[]) {
    const data = new Uint8Array(8 + sizes.length * 4)
    const view = new DataView(data.buffer)

    function setU32(num: number) {
      view.setUint32(offset, num)
      offset += 4
    }

    let offset = 0

    setU32(0)
    setU32(sizes.length)
    for (const size of sizes) {
      if (!isU32(size)) {
        throw TypeError(
          'The entry_size of stsz must have type of u32; received ' + size,
        )
      }

      setU32(size)
    }

    super('stsz', 0, 0, data)
  }
}

export function stsz(sizes: number[]) {
  return new Stsz(sizes)
}
