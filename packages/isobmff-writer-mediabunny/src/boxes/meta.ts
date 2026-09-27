import { FullContainerBox } from '../box-base'
import type { Hdlr } from './hdlr'
import type { Pitm } from './pitm'
import type { Iloc } from './iloc'
import type { Iinf } from './iinf'
import type { Iprp } from './iprp'

export interface MetaBoxes {
  hdlr: Hdlr
  pitm: Pitm
  iloc: Iloc
  iinf: Iinf
  iprp: Iprp
}

export class Meta extends FullContainerBox {
  constructor(metaBoxes: MetaBoxes) {
    super('meta', 0, 0, [
      metaBoxes.hdlr,
      metaBoxes.pitm,
      metaBoxes.iloc,
      metaBoxes.iinf,
      metaBoxes.iprp,
    ])
  }
}

export function meta(metaBoxes: MetaBoxes) {
  return new Meta(metaBoxes)
}
