import { FullBox } from '../box-base'
import { isU32, hasNonAsciiCharacters, writeAscii } from '../utils'

const defaultHandlerName = 'VideoHandle'

export class Hdlr extends FullBox {
  constructor(
    preDefined: number,
    handlerType: string,
    reserved: [number, number, number] = [0, 0, 0],
    name = defaultHandlerName,
  ) {
    if (!isU32(preDefined)) {
      throw TypeError(
        'The pre_defined of hdlr must have type of u32; received ' + preDefined,
      )
    }

    if (handlerType.length !== 4) {
      throw TypeError(
        'The handler_type of hdlr must be 4bytes; received ' + handlerType,
      )
    }
    if (hasNonAsciiCharacters(handlerType)) {
      throw TypeError(
        'The handler_type of hdlr must only include ascii characters; received ' +
          handlerType,
      )
    }

    reserved.forEach((reserved) => {
      if (!isU32(reserved)) {
        throw TypeError(
          'An item in reserved of hdlr must have type of u32; received ' +
            reserved,
        )
      }
    })

    if (name.includes('\0')) {
      throw TypeError(
        'The name of hdlr must not include null byte (\\x00); received ' + name,
      )
    }

    const nameEncoded = new TextEncoder().encode(name)
    const data = new Uint8Array(20 + nameEncoded.byteLength + 1)
    const view = new DataView(data.buffer)
    view.setUint32(0, preDefined)
    writeAscii(view, 4, handlerType)
    view.setUint32(8, reserved[0])
    view.setUint32(12, reserved[1])
    view.setUint32(16, reserved[2])
    data.set(nameEncoded, 20)
    view.setUint8(20 + nameEncoded.byteLength, 0)

    super('hdlr', 0, 0, data)
  }
}

export function hdlr(
  preDefined: number,
  handlerType: string,
  reserved?: [number, number, number],
  name?: string,
) {
  return new Hdlr(preDefined, handlerType, reserved, name)
}
