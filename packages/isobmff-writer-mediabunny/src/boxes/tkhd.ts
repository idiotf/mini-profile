import { FullBox } from '../box-base'
import {
  encodeFixedPoint,
  isU16,
  isU32,
  isU64,
  toBmffTimestamp,
} from '../utils'

// prettier-ignore
type Matrix3x3 = [
  number, number, number,
  number, number, number,
  number, number, number,
]

export interface TkhdFields {
  enabled?: boolean
  inMovie?: boolean
  inPreview?: boolean
  sizeIsAspectRatio?: boolean

  creationTime: Date
  modificationTime: Date
  trackID: number
  duration: number | bigint

  layer?: number
  alternateGroup?: number
  volume?: number

  matrix: Matrix3x3
  width: number
  height: number
}

export class Tkhd extends FullBox {
  constructor(fields: TkhdFields) {
    const creationTime = toBmffTimestamp(fields.creationTime)
    const modificationTime = toBmffTimestamp(fields.modificationTime)

    if (!isU64(creationTime)) {
      throw TypeError(
        'The creation_time of tkhd must be later than Jan 01 1904; received ' +
          fields.creationTime,
      )
    }

    if (!isU64(modificationTime)) {
      throw TypeError(
        'The modification_time of tkhd must be later than Jan 01 1904; received ' +
          fields.modificationTime,
      )
    }

    if (!isU32(fields.trackID)) {
      throw TypeError(
        'The track_ID of tkhd must have type of u32; received ' +
          fields.modificationTime,
      )
    }

    if (!isU64(fields.duration)) {
      throw TypeError(
        'The duration of tkhd must have type of u32 or u64; received ' +
          fields.modificationTime,
      )
    }

    if (fields.layer !== undefined && !isU16(fields.layer)) {
      throw TypeError(
        'The layer of tkhd must have type of u16; received ' + fields.layer,
      )
    }

    if (fields.alternateGroup !== undefined && !isU16(fields.alternateGroup)) {
      throw TypeError(
        'The alternate_group of tkhd must have type of u16; received ' +
          fields.alternateGroup,
      )
    }

    if (fields.volume !== undefined && !isU16(fields.volume)) {
      throw TypeError(
        'The volume of tkhd must have type of u16; received ' + fields.volume,
      )
    }

    if (!fields.matrix.every(isU32)) {
      throw TypeError(
        'The matrix of tkhd must have type of u32[9]; received ' +
          `[${fields.matrix.map((v) => JSON.stringify(v)).join(', ')}]`,
      )
    }

    const version =
      isU32(creationTime) && isU32(modificationTime) && isU32(fields.duration)
        ? 0
        : 1

    const flags =
      (fields.enabled ? 1 : 0) |
      (fields.inMovie ? 2 : 0) |
      (fields.inPreview ? 4 : 0) |
      (fields.sizeIsAspectRatio ? 8 : 0)

    const data = new Uint8Array(version === 1 ? 92 : 80)
    const view = new DataView(data.buffer)

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

    function setU64OrU32(num: number | bigint) {
      if (version === 1) {
        setU64(num)
      } else {
        setU32(Number(num))
      }
    }

    function skip(bytes: number) {
      offset += bytes
    }

    let offset = 0

    setU64OrU32(creationTime)
    setU64OrU32(modificationTime)
    setU32(fields.trackID)
    skip(4)
    setU64OrU32(fields.duration)
    skip(8)
    setU16(fields.layer ?? 0)
    setU16(fields.alternateGroup ?? 0)
    setU16(fields.volume ?? 0)
    skip(2)
    setU32(encodeFixedPoint(fields.matrix[0], 16))
    setU32(encodeFixedPoint(fields.matrix[1], 16))
    setU32(encodeFixedPoint(fields.matrix[2], 2, 30))
    setU32(encodeFixedPoint(fields.matrix[3], 16))
    setU32(encodeFixedPoint(fields.matrix[4], 16))
    setU32(encodeFixedPoint(fields.matrix[5], 2, 30))
    setU32(encodeFixedPoint(fields.matrix[6], 16))
    setU32(encodeFixedPoint(fields.matrix[7], 16))
    setU32(encodeFixedPoint(fields.matrix[8], 2, 30))
    setU32(encodeFixedPoint(fields.width, 16))
    setU32(encodeFixedPoint(fields.height, 16))

    super('tkhd', version, flags, data)
  }
}

export function tkhd(fields: TkhdFields) {
  return new Tkhd(fields)
}
