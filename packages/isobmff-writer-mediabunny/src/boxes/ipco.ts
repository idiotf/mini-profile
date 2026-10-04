import { type Box, ContainerBox } from '../box-base'

export class Ipco extends ContainerBox {
  constructor(boxes: Box[]) {
    super('ipco', boxes)
  }
}

export function ipco(boxes: Box[]) {
  return new Ipco(boxes)
}
