import { type Box, ContainerBox } from '../box-base'

export class Trak extends ContainerBox {
  constructor(boxes: Box[]) {
    super('trak', boxes)
  }
}

export function trak(boxes: Box[]) {
  return new Trak(boxes)
}
