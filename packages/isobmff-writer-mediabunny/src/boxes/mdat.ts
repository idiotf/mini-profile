import { Box } from '../box-base'

export class Mdat extends Box {
  constructor(data: Uint8Array) {
    super('mdat', data)
  }
}

export function mdat(data: Uint8Array) {
  return new Mdat(data)
}
