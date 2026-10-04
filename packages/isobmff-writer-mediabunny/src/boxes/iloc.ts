import { FullBox } from '../box-base'
import { isU16, isU32, isU64 } from '../utils'

/**
 * - `0`: file offset
 * - `1`: idat offset
 * - `2`: item offset
 */
export type ConstructionMethod = 0 | 1 | 2

export interface IlocItem {
  id: number
  constructionMethod?: ConstructionMethod
  extents: IlocExtent[]
}

export interface IlocExtent {
  index?: number
  offset: number
  length: number
}

function getSizeOf(num: number) {
  return !Number.isInteger(num) || num === 0 ? 0 : isU32(num) ? 4 : 8
}

export class Iloc extends FullBox {
  constructor(items: IlocItem[]) {
    const allExtents = items.flatMap((item) => item.extents)
    const allExtentsOffset = allExtents.map(({ offset }) => offset)
    const allExtentsLength = allExtents.map(({ length }) => length)
    const allExtentsIndex = allExtents
      .map(({ index }) => index)
      .filter((v) => v !== undefined)

    if (!allExtentsOffset.every(isU64)) {
      throw TypeError(
        'All the extent_offset of iloc must have type of u32 or u64',
      )
    }

    if (!allExtentsLength.every(isU64)) {
      throw TypeError(
        'All the extent_length of iloc must have type of u32 or u64',
      )
    }

    if (!allExtentsIndex.every(isU64)) {
      throw TypeError(
        'All the extent_index of iloc must have type of u32 or u64',
      )
    }

    const baseOffset = Math.min(...allExtentsOffset)
    const baseOffsetSize = getSizeOf(baseOffset)

    const maxOffset = Math.max(0, ...allExtentsOffset) - baseOffset
    const offsetSize = getSizeOf(maxOffset)

    const maxLength = Math.max(0, ...allExtentsLength)
    const lengthSize = getSizeOf(maxLength)

    const maxExtentIndex = Math.max(0, ...allExtentsIndex)
    const indexSize = getSizeOf(maxExtentIndex)
    if (indexSize && allExtentsIndex.length !== allExtents.length) {
      throw TypeError(
        'When a IlocExtent.index is provided, all extents must also have it',
      )
    }

    const onlyU16 = isU16(items.length) && items.every(({ id }) => isU16(id))
    const version = onlyU16
      ? items.some((item) => item.constructionMethod) || indexSize
        ? 1
        : 0
      : 2

    const extentSize = indexSize + offsetSize + lengthSize
    const itemsSize = items.reduce(
      (acc, { extents }) =>
        acc +
        (version === 0 ? 6 : version === 2 ? 10 : 8) +
        baseOffsetSize +
        extents.length * extentSize,
      0,
    )
    const itemsOffset = version === 2 ? 6 : 4
    const data = new Uint8Array(itemsOffset + itemsSize)
    const view = new DataView(data.buffer)

    view.setUint16(
      0,
      (offsetSize << 12) |
        (lengthSize << 8) |
        (baseOffsetSize << 4) |
        indexSize,
    )

    if (version === 2) {
      view.setUint32(2, items.length)
    } else {
      view.setUint16(2, items.length)
    }

    function setU16(num: number) {
      view.setUint16(offset, num)
      offset += 2
    }

    function setU32(num: number) {
      view.setUint32(offset, num)
      offset += 4
    }

    function setU64(num: number | bigint) {
      view.setBigUint64(offset, BigInt(num))
      offset += 8
    }

    function setU64OrU32(size: 0 | 4 | 8, num: number) {
      if (size === 8) {
        setU64(num)
      } else if (size === 4) {
        setU32(num)
      }
    }

    let offset = itemsOffset
    for (const { id, constructionMethod, extents } of items) {
      if (!isU32(id)) {
        throw TypeError(
          'The item_ID of iloc must have type of u16 or u32; received ' + id,
        )
      }

      if (version === 2) {
        setU32(id)
      } else {
        setU16(id)
      }

      if (version) {
        setU16(constructionMethod ?? 0)
      }
      setU16(0)

      setU64OrU32(baseOffsetSize, baseOffset)

      if (!isU16(extents.length)) {
        throw TypeError(
          'The length of extents in a item must have type of u16; received ' +
            extents.length,
        )
      }
      setU16(extents.length)

      for (const extent of extents) {
        // When indexSize !== 0, extent.index is always provided
        // because of above verification
        setU64OrU32(indexSize, extent.index!)
        setU64OrU32(offsetSize, extent.offset - baseOffset)
        setU64OrU32(lengthSize, extent.length)
      }
    }

    super('iloc', version, 0, data)
  }
}

export function iloc(items: IlocItem[]) {
  return new Iloc(items)
}
