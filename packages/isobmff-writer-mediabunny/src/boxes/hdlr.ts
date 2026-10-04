import { FullBox } from '../box-base'
import { hasNonAsciiCharacters, writeAscii } from '../utils'

export class Hdlr extends FullBox {
  constructor(handlerType: string, name?: string) {
    if (hasNonAsciiCharacters(handlerType)) {
      throw TypeError(
        'The handler_type of hdlr must only include ascii characters; received ' +
          handlerType,
      )
    }
    if (handlerType.length !== 4) {
      throw TypeError(
        'The handler_type of hdlr must be 4bytes; received ' + handlerType,
      )
    }

    if (name !== undefined && name.includes('\0')) {
      throw TypeError(
        'The name of hdlr must not include null byte (\\x00); received ' + name,
      )
    }

    const nameEncoded = new TextEncoder().encode(name)
    const data = new Uint8Array(20 + nameEncoded.byteLength + 1)
    const view = new DataView(data.buffer)
    writeAscii(view, 4, handlerType)
    data.set(nameEncoded, 20)
    view.setUint8(20 + nameEncoded.byteLength, 0)

    super('hdlr', 0, 0, data)
  }
}

export function hdlr(handlerType: string, name?: string) {
  return new Hdlr(handlerType, name)
}
