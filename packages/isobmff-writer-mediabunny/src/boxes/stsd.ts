import { type Box, FullContainerBox } from '../box-base'

export class Stsd extends FullContainerBox {
  constructor(sampleEntries: Box[]) {
    const beforeBoxes = new Uint8Array(4)
    const view = new DataView(beforeBoxes.buffer)
    view.setUint32(0, sampleEntries.length)

    super('stsd', 0, 0, sampleEntries, beforeBoxes)
  }
}

export function stsd(sampleEntries: Box[]) {
  return new Stsd(sampleEntries)
}
