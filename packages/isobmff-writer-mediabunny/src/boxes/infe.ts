import { FullBox } from '../box-base'
import { hasNonAsciiCharacters, isU16, isU32, writeAscii } from '../utils'

export class Infe extends FullBox {
  constructor(
    itemID: number,
    itemProtectionIndex: number,
    itemType: string,
    itemName = '',
  ) {
    if (!isU32(itemID)) {
      throw TypeError(
        'The item_ID of infe must have type of u16 or u32; received ' + itemID,
      )
    }

    if (itemID === 0) {
      throw TypeError(
        'The item_ID of infe must not be zero; received ' + itemID,
      )
    }

    if (itemProtectionIndex !== 0) {
      throw TypeError(
        `Currently, item_protection_index isn't supported yet; received ` +
          itemID,
      )
    }

    if (itemType.length !== 4) {
      throw TypeError(
        'The item_type of infe must be 4bytes; received ' + itemType,
      )
    }
    if (hasNonAsciiCharacters(itemType)) {
      throw TypeError(
        'The item_type of infe must only include ascii characters; received ' +
          itemType,
      )
    }

    if (itemName.includes('\0')) {
      throw TypeError(
        'The item_name of infe must not include null byte (\\x00); received ' +
          itemName,
      )
    }

    const version = isU16(itemID) ? 2 : 3
    const nameEncoded = new TextEncoder().encode(itemName)
    const data = new Uint8Array(
      (version === 3 ? 11 : 9) + nameEncoded.byteLength,
    )
    const view = new DataView(data.buffer)
    if (version === 3) {
      view.setUint32(0, itemID)
      view.setUint16(4, itemProtectionIndex)
      writeAscii(view, 6, itemType)
      data.set(nameEncoded, 10)
      view.setUint8(10 + nameEncoded.byteLength, 0)
    } else {
      view.setUint16(0, itemID)
      view.setUint16(2, itemProtectionIndex)
      writeAscii(view, 4, itemType)
      data.set(nameEncoded, 8)
      view.setUint8(8 + nameEncoded.byteLength, 0)
    }

    super('infe', version, 0, data)
  }
}

export function infe(
  itemID: number,
  itemProtectionIndex: number,
  itemType: string,
  itemName?: string,
) {
  return new Infe(itemID, itemProtectionIndex, itemType, itemName)
}
