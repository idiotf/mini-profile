import { FullContainerBox } from '../box-base'
import { isU16 } from '../utils'
import type { Infe } from './infe'

export class Iinf extends FullContainerBox {
  constructor(infeBoxes: Infe[]) {
    const infeCount = infeBoxes.length
    const version = isU16(infeCount) ? 0 : 1
    const beforeBoxes = new Uint8Array(version === 1 ? 4 : 2)
    const view = new DataView(beforeBoxes.buffer)
    if (version === 1) {
      view.setUint32(0, infeCount)
    } else {
      view.setUint16(0, infeCount)
    }

    super('iinf', version, 0, infeBoxes, beforeBoxes)
  }
}

export function iinf(infeBoxes: Infe[]) {
  return new Iinf(infeBoxes)
}
