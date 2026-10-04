import { type Box, ContainerBox } from '../box-base'

export class Stbl extends ContainerBox {
  constructor(boxes: Box[]) {
    super('stbl', boxes)
  }
}

export function stbl(boxes: Box[]) {
  return new Stbl(boxes)
}
