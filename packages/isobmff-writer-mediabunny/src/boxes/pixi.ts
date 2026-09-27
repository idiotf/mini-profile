import { FullBox } from '../box-base'
import { isU8 } from '../utils'

export class Pixi extends FullBox {
  constructor(channelsBits: number[]) {
    if (channelsBits.length >= 256) {
      throw TypeError('The length of channels of pixi must be less than 256')
    }

    if (!channelsBits.every(isU8)) {
      throw TypeError('All the bits of channels of pixi must have type of u8')
    }

    const data = new Uint8Array([channelsBits.length, ...channelsBits])
    super('pixi', 0, 0, data)
  }
}

export function pixi(channelsBits: number[]) {
  return new Pixi(channelsBits)
}
