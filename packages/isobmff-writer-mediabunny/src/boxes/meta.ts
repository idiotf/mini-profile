import { type Box, FullContainerBox } from '../box-base'

export class Meta extends FullContainerBox {
  constructor(boxes: Box[]) {
    super('meta', 0, 0, boxes)
  }
}

export function meta(boxes: Box[]) {
  return new Meta(boxes)
}
