import { FullBox } from '../box-base'
import { isU15, isU16, isU32, isU7 } from '../utils'

export interface IpmaEntry {
  itemID: number
  associations: IpmaAssociation[]
}

export interface IpmaAssociation {
  essential: boolean
  propertyIndex: number
}

export class Ipma extends FullBox {
  constructor(entries: IpmaEntry[]) {
    const version = entries.every(({ itemID }) => {
      if (!isU32(itemID)) {
        throw TypeError(
          'The item_ID of ipma must have type of u16 or u32; received ' +
            itemID,
        )
      }

      return isU16(itemID)
    })
      ? 0
      : 1

    const flags = entries.every((entry) =>
      entry.associations.every(({ propertyIndex }) => {
        if (!isU15(propertyIndex)) {
          throw TypeError(
            'The property_index of ipma must have type of u7 or u15; received ' +
              propertyIndex,
          )
        }

        return isU7(propertyIndex)
      }),
    )
      ? 0
      : 1

    const entriesSize = entries.reduce(
      (acc, { associations }) =>
        acc +
        (version === 0 ? 3 : 5) +
        associations.length * (flags === 0 ? 1 : 2),
      0,
    )

    const data = new Uint8Array(4 + entriesSize)
    const view = new DataView(data.buffer)

    function setU8(num: number) {
      view.setUint8(offset, num)
      offset += 1
    }

    function setU16(num: number) {
      view.setUint16(offset, num)
      offset += 2
    }

    function setU32(num: number) {
      view.setUint32(offset, num)
      offset += 4
    }

    let offset = 0
    
    setU32(entries.length)
    for (const entry of entries) {
      if (version === 0) {
        setU16(entry.itemID)
      } else {
        setU32(entry.itemID)
      }

      if (entry.associations.length >= 256) {
        throw TypeError(
          'The length of associations of ipma must have type of u8; received ' +
            entry.associations.length,
        )
      }
      setU8(entry.associations.length)

      for (const { essential, propertyIndex } of entry.associations) {
        if (flags === 0) {
          setU8((essential ? 0x80 : 0) | propertyIndex)
        } else {
          setU16((essential ? 0x80_00 : 0) | propertyIndex)
        }
      }
    }

    super('ipma', version, flags, data)
  }
}

export function ipma(entries: IpmaEntry[]) {
  return new Ipma(entries)
}
