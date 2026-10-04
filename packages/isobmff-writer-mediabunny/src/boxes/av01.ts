import { type Box, ContainerBox } from '../box-base'
import { isU16, isU32 } from '../utils'

export interface Av01Fields {
  dataReferenceIndex: number
  width: number
  height: number
  horizResolution: number
  vertResolution: number
  frameCount: number
  compressorName?: string
  depth: number
}

export class Av01 extends ContainerBox {
  constructor(fields: Av01Fields, boxes: Box[]) {
    if (!isU16(fields.dataReferenceIndex)) {
      throw TypeError(
        'The data_reference_index of av01 must have type of u16; received ' +
          fields.dataReferenceIndex,
      )
    }

    if (!isU16(fields.width)) {
      throw TypeError(
        'The width of av01 must have type of u16; received ' + fields.width,
      )
    }

    if (!isU16(fields.height)) {
      throw TypeError(
        'The height of av01 must have type of u16; received ' + fields.height,
      )
    }

    if (!isU32(fields.horizResolution)) {
      throw TypeError(
        'The horizresolution of av01 must have type of u32; received ' +
          fields.horizResolution,
      )
    }

    if (!isU32(fields.vertResolution)) {
      throw TypeError(
        'The vertresolution of av01 must have type of u32; received ' +
          fields.vertResolution,
      )
    }

    if (!isU16(fields.frameCount)) {
      throw TypeError(
        'The frame_count of av01 must have type of u16; received ' +
          fields.frameCount,
      )
    }

    const encodedCompressorName = new TextEncoder().encode(
      fields.compressorName,
    )
    if (encodedCompressorName.byteLength > 31) {
      throw TypeError(
        'The compressorname of av01 must be shorter than 31 bytes in UTF-8; received ' +
          fields.compressorName,
      )
    }

    if (!isU16(fields.depth)) {
      throw TypeError(
        'The depth of av01 must have type of u16; received ' + fields.depth,
      )
    }

    const beforeBoxes = new Uint8Array(78)
    const view = new DataView(beforeBoxes.buffer)
    view.setUint16(6, fields.dataReferenceIndex)
    view.setUint16(24, fields.width)
    view.setUint16(26, fields.height)
    view.setUint32(28, fields.horizResolution)
    view.setUint32(32, fields.vertResolution)
    view.setUint16(40, fields.frameCount)
    view.setUint8(42, encodedCompressorName.byteLength)
    beforeBoxes.set(encodedCompressorName, 43)
    view.setUint16(74, fields.depth)
    view.setUint16(76, 0)

    super('av01', boxes, beforeBoxes)
  }
}

export function av01(fields: Av01Fields, boxes: Box[]) {
  return new Av01(fields, boxes)
}
