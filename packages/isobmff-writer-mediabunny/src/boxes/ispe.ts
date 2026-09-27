import { FullBox } from '../box-base'
import { isU32 } from '../utils'

export class Ispe extends FullBox {
  constructor(width: number, height: number) {
    if (!isU32(width) || !isU32(height)) {
      throw TypeError(
        `The width and height of ispe must have type of u32; ` +
          `received ${width} * ${height}`,
      )
    }

    const data = new Uint8Array(8)
    const view = new DataView(data.buffer)
    view.setUint32(0, width)
    view.setUint32(4, height)

    super('ispe', 0, 0, data)
  }
}

export function ispe(width: number, height: number) {
  return new Ispe(width, height)
}
