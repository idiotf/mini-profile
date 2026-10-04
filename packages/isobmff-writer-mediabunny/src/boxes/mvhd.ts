import { FullBox } from '../box-base'
import { encodeFixedPoint, isU32, isU64, toBmffTimestamp } from '../utils'

// prettier-ignore
type Matrix3x3 = [
  number, number, number,
  number, number, number,
  number, number, number,
]

export interface MvhdFields {
  creationTime: Date
  modificationTime: Date
  timescale: number
  duration: number | bigint

  rate?: number
  volume?: number

  matrix: Matrix3x3
  nextTrackID: number
}

export class Mvhd extends FullBox {
  constructor(fields: MvhdFields) {
    const creationTime = toBmffTimestamp(fields.creationTime)
    const modificationTime = toBmffTimestamp(fields.modificationTime)

    if (!isU64(creationTime)) {
      throw TypeError(
        'The creation_time of mvhd must be later than Jan 01 1904; received ' +
          fields.creationTime,
      )
    }

    if (!isU64(modificationTime)) {
      throw TypeError(
        'The modification_time of mvhd must be later than Jan 01 1904; received ' +
          fields.modificationTime,
      )
    }

    if (!isU32(fields.timescale)) {
      throw TypeError(
        'The timescale of mvhd must have type of u32; received ' +
          fields.timescale,
      )
    }

    if (!isU64(fields.duration)) {
      throw TypeError(
        'The duration of mvhd must have type of u32 or u64; received ' +
          fields.duration,
      )
    }

    if (!fields.matrix.every(isU32)) {
      throw TypeError(
        'The matrix of mvhd must have type of u32[9]; received ' +
          `[${fields.matrix.map((v) => JSON.stringify(v)).join(', ')}]`,
      )
    }

    if (!isU32(fields.nextTrackID)) {
      throw TypeError(
        'The next_track_ID of mvhd must have type of u32; received ' +
          fields.nextTrackID,
      )
    }

    const version =
      isU32(creationTime) &&
      isU32(modificationTime) &&
      isU32(fields.duration)
        ? 0
        : 1

    const data = new Uint8Array(version === 1 ? 108 : 96)
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
    setU32(fields.timescale)
    setU64OrU32(fields.duration)
    setU32(encodeFixedPoint(fields.rate ?? 1, 16))
    setU16(encodeFixedPoint(fields.volume ?? 1, 8))
    skip(2)
    skip(8)
    setU32(fields.matrix[0])
    setU32(fields.matrix[1])
    setU32(fields.matrix[2])
    setU32(fields.matrix[3])
    setU32(fields.matrix[4])
    setU32(fields.matrix[5])
    setU32(fields.matrix[6])
    setU32(fields.matrix[7])
    setU32(fields.matrix[8])
    skip(24)
    setU32(fields.nextTrackID)

    super('mvhd', version, 0, data)
  }
}

export function mvhd(fields: MvhdFields) {
  return new Mvhd(fields)
}
