import { FullBox } from '../box-base'
import { isU16 } from '../utils'

export class Vmhd extends FullBox {
  constructor(graphicsMode: number, opColor: [number, number, number]) {
    if (!isU16(graphicsMode)) {
      throw TypeError(
        'The graphicsmode of vmhd must have type of u16; received ' +
          graphicsMode,
      )
    }

    if (!opColor.every(isU16)) {
      throw TypeError('All the opcolor of vmhd must have type of u16')
    }

    const data = new Uint8Array(8)
    const view = new DataView(data.buffer)
    view.setUint16(0, graphicsMode)
    view.setUint16(2, opColor[0])
    view.setUint16(4, opColor[1])
    view.setUint16(6, opColor[2])

    super('vmhd', 0, 1, data)
  }
}

export function vmhd(graphicsMode: number, opColor: [number, number, number]) {
  return new Vmhd(graphicsMode, opColor)
}
