import { type Box, ContainerBox } from '../box-base'

export class Mdia extends ContainerBox {
  constructor(boxes: Box[]) {
    super('mdia', boxes)
  }
}

export function mdia(boxes: Box[]) {
  return new Mdia(boxes)
}
