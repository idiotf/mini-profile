import { ContainerBox } from '../box-base'
import type { Elst } from './elst'

export class Edts extends ContainerBox {
  constructor(elst: Elst) {
    super('edts', [elst])
  }
}

export function edts(elst: Elst) {
  return new Edts(elst)
}
