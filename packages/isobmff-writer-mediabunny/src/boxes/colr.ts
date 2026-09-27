import { Box } from '../box-base'
import { hasNonAsciiCharacters, isU16, writeAscii } from '../utils'

export class Colr extends Box {
  constructor(type: string, payload: Uint8Array) {
    if (type.length !== 4) {
      throw TypeError('The type of colr must be 4bytes; received ' + type)
    }
    if (hasNonAsciiCharacters(type)) {
      throw TypeError(
        'The type of colr must only include ascii characters; received ' +
          type,
      )
    }

    const data = new Uint8Array(4 + payload.length)
    const view = new DataView(data.buffer)
    writeAscii(view, 0, type)
    data.set(payload, 4)

    super('colr', data)
  }
}

export function colr(type: string, payload: Uint8Array) {
  return new Colr(type, payload)
}

export interface ColrNclxFields {
  colourPrimaries: number
  transferCharacteristics: number
  matrixCoefficients: number
  fullRangeFlag: boolean
}

colr.nclx = (fields: ColrNclxFields) => {
  if (!isU16(fields.colourPrimaries)) {
    throw TypeError(
      'The colour_primaries of colr must have type of u16; received ' +
        fields.colourPrimaries,
    )
  }

  if (!isU16(fields.transferCharacteristics)) {
    throw TypeError(
      'The transfer_characteristics of colr must have type of u16; received ' +
        fields.transferCharacteristics,
    )
  }

  if (!isU16(fields.matrixCoefficients)) {
    throw TypeError(
      'The matrix_coefficients of colr must have type of u16; received ' +
        fields.matrixCoefficients,
    )
  }

  const data = new Uint8Array(7)
  const view = new DataView(data.buffer)
  view.setUint16(0, fields.colourPrimaries)
  view.setUint16(2, fields.transferCharacteristics)
  view.setUint16(4, fields.matrixCoefficients)
  view.setUint8(6, +fields.fullRangeFlag << 7)

  return new Colr('nclx', data)
}
