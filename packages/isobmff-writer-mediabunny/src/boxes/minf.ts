import { type Box, ContainerBox } from '../box-base'

export class Minf extends ContainerBox {
  constructor(boxes: Box[]) {
    super('minf', boxes)
  }
}

export function minf(boxes: Box[]) {
  return new Minf(boxes)
}
