import { type Box, ContainerBox } from '../box-base'

export class Iprp extends ContainerBox {
  constructor(boxes: Box[]) {
    super('iprp', boxes)
  }
}

export function iprp(boxes: Box[]) {
  return new Iprp(boxes)
}
