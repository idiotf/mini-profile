import { type Box, ContainerBox } from '../box-base'

export class Dinf extends ContainerBox {
  constructor(boxes: Box[]) {
    super('dinf', boxes)
  }
}

export function dinf(boxes: Box[]) {
  return new Dinf(boxes)
}
