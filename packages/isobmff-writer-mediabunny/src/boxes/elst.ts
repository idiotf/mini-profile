import { FullBox } from '../box-base'
import { encodeFixedPoint, isI64, isU32, isU64 } from '../utils'

export interface ElstEntry {
  segmentDuration: number
  mediaTime: number
  mediaRate: number
}

export class Elst extends FullBox {
  constructor(entries: ElstEntry[], loop?: boolean) {
    const version = entries.every((entry) => {
      if (!isU64(entry.segmentDuration)) {
        throw TypeError(
          'The segment_duration of elst must have type of u32 or u64; received ' +
            entry.segmentDuration,
        )
      }

      if (!isI64(entry.mediaTime)) {
        throw TypeError(
          'The media_time of elst must have type of i32 or i64; received ' +
            entry.mediaTime,
        )
      }

      return isU32(entry.segmentDuration) && isU32(entry.mediaTime)
    })
      ? 0
      : 1

    const flags = loop ? 1 : 0

    const data = new Uint8Array(4 + entries.length * (version === 1 ? 20 : 12))
    const view = new DataView(data.buffer)

    function setU32(num: number) {
      view.setUint32(offset, num)
      offset += 4
    }

    function setI32(num: number) {
      view.setInt32(offset, num)
      offset += 4
    }

    function setU64(num: number | bigint) {
      view.setBigUint64(offset, BigInt(num))
      offset += 8
    }

    function setI64(num: number | bigint) {
      view.setBigInt64(offset, BigInt(num))
      offset += 8
    }

    function setU64OrU32(num: number | bigint) {
      if (version === 1) {
        setU64(num)
      } else {
        setU32(Number(num))
      }
    }

    function setI64OrI32(num: number | bigint) {
      if (version === 1) {
        setI64(num)
      } else {
        setI32(Number(num))
      }
    }

    let offset = 0

    setU32(entries.length)
    for (const { segmentDuration, mediaTime, mediaRate } of entries) {
      setU64OrU32(segmentDuration)
      setI64OrI32(mediaTime)
      setU32(encodeFixedPoint(mediaRate, 16))
    }

    super('elst', version, flags, data)
  }
}

export function elst(entries: ElstEntry[], loop?: boolean) {
  return new Elst(entries, loop)
}
