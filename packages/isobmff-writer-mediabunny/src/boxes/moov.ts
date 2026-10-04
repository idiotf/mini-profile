import { type Box, ContainerBox } from '../box-base'

export class Moov extends ContainerBox {
  constructor(boxes: Box[]) {
    super('moov', boxes)
  }
}

export function moov(boxes: Box[]) {
  return new Moov(boxes)
}
