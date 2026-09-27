import { FullBox } from '../box-base'
import { isU16, isU32 } from '../utils'

export class Pitm extends FullBox {
  constructor(itemID = 1) {
    if (!isU32(itemID)) {
      throw TypeError(
        'The item_ID of pitm must have type of u16 or u32; received ' + itemID,
      )
    }

    if (itemID === 0) {
      throw TypeError(
        'The item_ID of pitm must not be zero; received ' + itemID,
      )
    }

    const version = isU16(itemID) ? 0 : 1
    const data = new Uint8Array(version === 1 ? 4 : 2)
    const view = new DataView(data.buffer)
    if (version === 1) {
      view.setUint32(0, itemID)
    } else {
      view.setUint16(0, itemID)
    }

    super('pitm', version, 0, data)
  }
}

export function pitm(itemID?: number) {
  return new Pitm(itemID)
}
