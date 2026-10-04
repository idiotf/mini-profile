import { FullBox } from '../box-base'
import { isU32, isU64, toBmffTimestamp } from '../utils'

export interface MdhdFields {
  creationTime: Date
  modificationTime: Date
  timescale: number
  duration: number | bigint
  language?: string
}

function isSmallCaseAlphabet(char: string) {
  return 'a' <= char && char <= 'z'
}

function isValidLanguage(language: string) {
  return (
    language.length === 3 &&
    isSmallCaseAlphabet(language[0]!) &&
    isSmallCaseAlphabet(language[1]!) &&
    isSmallCaseAlphabet(language[2]!)
  )
}

function encodeLanguageCode(language: string) {
  return (
    ((language.charCodeAt(0) - 96) << 10) |
    ((language.charCodeAt(1) - 96) << 5) |
    (language.charCodeAt(2) - 96)
  )
}

export class Mdhd extends FullBox {
  constructor(fields: MdhdFields) {
    const creationTime = toBmffTimestamp(fields.creationTime)
    const modificationTime = toBmffTimestamp(fields.modificationTime)

    if (!isU64(creationTime)) {
      throw TypeError(
        'The creation_time of mdhd must be later than Jan 01 1904; received ' +
          fields.creationTime,
      )
    }

    if (!isU64(modificationTime)) {
      throw TypeError(
        'The modification_time of mdhd must be later than Jan 01 1904; received ' +
          fields.modificationTime,
      )
    }

    if (!isU32(fields.timescale)) {
      throw TypeError(
        'The timescale of mdhd must have type of u32; received ' +
          fields.timescale,
      )
    }

    if (!isU64(fields.duration)) {
      throw TypeError(
        'The duration of mdhd must have type of u32 or u64; received ' +
          fields.duration,
      )
    }

    if (fields.language !== undefined && !isValidLanguage(fields.language)) {
      throw TypeError('Invalid language of mdhd; received ' + fields.language)
    }

    const version =
      isU32(creationTime) &&
      isU32(modificationTime) &&
      isU32(fields.duration)
        ? 0
        : 1

    const data = new Uint8Array(version === 1 ? 32 : 20)
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
    setU16(encodeLanguageCode(fields.language ?? 'und'))
    skip(2)

    super('mdhd', version, 0, data)
  }
}

export function mdhd(fields: MdhdFields) {
  return new Mdhd(fields)
}
