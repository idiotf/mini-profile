import { ContainerBox } from '../box-base'
import type { Ipco } from './ipco'
import type { Ipma } from './ipma'

export interface IprpBoxes {
  ipco: Ipco
  ipma: Ipma
}

export class Iprp extends ContainerBox {
  constructor(iprpBoxes: IprpBoxes) {
    super('iprp', [iprpBoxes.ipco, iprpBoxes.ipma])
  }
}

export function iprp(iprpBoxes: IprpBoxes) {
  return new Iprp(iprpBoxes)
}
