import { type Box, FullContainerBox } from '../box-base'

export class Dref extends FullContainerBox {
  constructor(entries: Box[]) {
    const beforeBoxes = new Uint8Array(4)
    const view = new DataView(beforeBoxes.buffer)
    view.setUint32(0, entries.length)

    super('dref', 0, 0, entries, beforeBoxes)
  }
}

export function dref(entries: Box[]) {
  return new Dref(entries)
}
