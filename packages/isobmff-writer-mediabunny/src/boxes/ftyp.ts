import { Box } from '../box-base'
import { hasNonAsciiCharacters, isU32, writeAscii } from '../utils'

export class Ftyp extends Box {
  constructor(
    majorBrand: string,
    minorVersion: number,
    compatibleBrands: string[],
  ) {
    if (majorBrand.length !== 4) {
      throw TypeError(
        'The major_brand of ftyp must be 4bytes; received ' + majorBrand,
      )
    }
    if (hasNonAsciiCharacters(majorBrand)) {
      throw TypeError(
        'The major_brand of ftyp must only include ascii characters; received ' +
          majorBrand,
      )
    }

    if (!isU32(minorVersion)) {
      throw TypeError(
        'The minor_version of ftyp must have type of u32; received ' +
          minorVersion,
      )
    }

    compatibleBrands.forEach((brand) => {
      if (brand.length !== 4) {
        throw TypeError(
          'An item in compatible_brands of ftyp must be 4bytes; received ' +
            majorBrand,
        )
      }
      if (hasNonAsciiCharacters(brand)) {
        throw TypeError(
          'An item in compatible_brands of ftyp must only include ascii characters; received ' +
            majorBrand,
        )
      }
    })

    const data = new Uint8Array(4 + 4 + compatibleBrands.length * 4)
    const view = new DataView(data.buffer)
    writeAscii(view, 0, majorBrand)
    view.setUint32(4, minorVersion)

    let offset = 8
    for (const brand of compatibleBrands) {
      writeAscii(view, offset, brand)
      offset += 4
    }

    super('ftyp', data)
  }
}

export function ftyp(
  majorBrand: string,
  minorVersion: number,
  compatibleBrands: string[],
) {
  return new Ftyp(majorBrand, minorVersion, compatibleBrands)
}
