export function hasNonAsciiCharacters(str: string) {
  return str.split('').some((char) => char.charCodeAt(0) > 127)
}

export function writeAscii(view: DataView, byteOffset: number, str: string) {
  for (let i = 0; i < str.length; ++i) {
    view.setUint8(byteOffset + i, str.charCodeAt(i))
  }
}

export function writeU24(
  view: DataView,
  byteOffset: number,
  value: number,
  littleEndian?: boolean,
) {
  if (littleEndian) {
    view.setUint8(byteOffset, value)
    view.setUint16(byteOffset + 1, value >> 8, true)
  } else {
    view.setUint8(byteOffset, value >> 16)
    view.setUint16(byteOffset + 1, value)
  }
}

export function isIntOrBigInt(value: unknown) {
  return typeof value == 'bigint' || Number.isInteger(value)
}

export function isU4(num: number | bigint) {
  return isIntOrBigInt(num) && 0 <= num && num <= 0b1111
}

export function isU5(num: number | bigint) {
  return isIntOrBigInt(num) && 0 <= num && num <= 0b11111
}

export function isU7(num: number | bigint) {
  return isIntOrBigInt(num) && 0 <= num && num <= 0x7f
}

export function isU8(num: number | bigint) {
  return isIntOrBigInt(num) && 0 <= num && num <= 0xff
}

export function isU15(num: number | bigint) {
  return isIntOrBigInt(num) && 0 <= num && num <= 0x7f_ff
}

export function isU16(num: number | bigint) {
  return isIntOrBigInt(num) && 0 <= num && num <= 0xff_ff
}

export function isU24(num: number | bigint) {
  return isIntOrBigInt(num) && 0 <= num && num <= 0xff_ff_ff
}

export function isU32(num: number | bigint) {
  return isIntOrBigInt(num) && 0 <= num && num <= 0xffff_ffff
}

export function isU64(num: number | bigint) {
  return isIntOrBigInt(num) && 0 <= num && num <= 0xffff_ffff_ffff_ffffn
}

export function isI64(num: number | bigint) {
  return (
    isIntOrBigInt(num) &&
    -0x8000_0000_0000_0000n <= num &&
    num <= 0x7fff_ffff_ffff_ffffn
  )
}

const BMFF_1970_OFFSET = 2_082_844_800

export function toBmffTimestamp(date: Date) {
  return Math.floor(date.getTime() / 1000) + BMFF_1970_OFFSET
}

export function encodeFixedPoint(number: number, bits: number) {
  const pow2 = 1 << bits

  if (number < 0 || pow2 <= number) {
    throw TypeError(
      `Fixed point number must be in range [0, ${pow2}); received ${number}`,
    )
  }

  const int = number & (pow2 - 1)
  const low = (pow2 * (number % 1)) | 0
  return (int << bits) | low
}
