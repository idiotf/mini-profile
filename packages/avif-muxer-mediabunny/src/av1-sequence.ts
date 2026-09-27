import { BitReader } from '@mini-profile/bit-reader'

const CSP_UNKNOWN = 0
const SELECT_SCREEN_CONTENT_TOOLS = 2
const CP_UNSPECIFIED = 2
const TC_UNSPECIFIED = 2
const MC_UNSPECIFIED = 2
const CP_BT_709 = 1
const TC_SRGB = 13
const MC_IDENTITY = 0

export interface ColorConfig {
  colorPrimaries: number
  transferCharacteristics: number
  matrixCoefficients: number
  colorRange: boolean
}

export interface SequenceHeader extends ColorConfig {
  profile: 0 | 1 | 2
  levelIdx0: number

  seqTier0: boolean
  highBitdepth: boolean
  twelveBit: boolean
  monochrome: boolean

  chromaSubsamplingX: boolean
  chromaSubsamplingY: boolean
  chromaSamplePosition: 0 | 1 | 2 | 3

  initialPresentationDelay: number | undefined
}

export function parseSequenceHeader(seq: Uint8Array): SequenceHeader {
  let seqLevelIdx0!: number
  let seqTier0!: boolean
  let highBitdepth!: boolean
  let twelveBit!: boolean
  let monochrome!: boolean
  let chromaSubsamplingX!: boolean
  let chromaSubsamplingY!: boolean
  let chromaSamplePosition: 0 | 1 | 2 | 3 = CSP_UNKNOWN
  let initialPresentationDelay
  let colorConfigData

  function colorConfig(): ColorConfig {
    highBitdepth = reader.readBool()
    twelveBit = seqProfile === 2 && highBitdepth && reader.readBool()
    monochrome = seqProfile !== 1 && reader.readBool()

    let colorPrimaries
    let transferCharacteristics
    let matrixCoefficients
    let colorRange

    const colorDescriptionPresentFlag = reader.readBool()
    if (colorDescriptionPresentFlag) {
      colorPrimaries = reader.read(8)
      transferCharacteristics = reader.read(8)
      matrixCoefficients = reader.read(8)
    } else {
      colorPrimaries = CP_UNSPECIFIED
      transferCharacteristics = TC_UNSPECIFIED
      matrixCoefficients = MC_UNSPECIFIED
    }

    if (monochrome) {
      colorRange = reader.readBool()

      chromaSubsamplingX = true
      chromaSubsamplingY = true
      chromaSamplePosition = CSP_UNKNOWN
    } else if (
      colorPrimaries === CP_BT_709 &&
      transferCharacteristics === TC_SRGB &&
      matrixCoefficients === MC_IDENTITY
    ) {
      colorRange = reader.readBool()

      chromaSubsamplingX = false
      chromaSubsamplingY = false
    } else {
      colorRange = reader.readBool()

      if (seqProfile === 0) {
        chromaSubsamplingX = true
        chromaSubsamplingY = true
      } else if (seqProfile === 1) {
        chromaSubsamplingX = false
        chromaSubsamplingY = false
      } else {
        if (twelveBit) {
          chromaSubsamplingX = reader.readBool()
          chromaSubsamplingY = chromaSubsamplingX && reader.readBool()
        } else {
          chromaSubsamplingX = true
          chromaSubsamplingY = false
        }
      }

      if (chromaSubsamplingX && chromaSubsamplingY) {
        chromaSamplePosition = reader.read(2) as 0 | 1 | 2 | 3
      }
    }

    return {
      colorPrimaries,
      transferCharacteristics,
      matrixCoefficients,
      colorRange,
    }
  }

  const reader = new BitReader(seq)

  const seqProfile = reader.read(3)
  reader.skip(1)

  const reducedStillPictureHeader = reader.read(1)
  if (reducedStillPictureHeader) {
    seqLevelIdx0 = reader.read(5)
    seqTier0 = false

    const frameWidthBitsMinus1 = reader.read(4)
    const frameHeightBitsMinus1 = reader.read(4)

    reader.skip(frameWidthBitsMinus1 + frameHeightBitsMinus1 + 8)
    colorConfigData = colorConfig()
  } else {
    let decoderModelInfoPresentFlag
    let bufferDelayLengthMinus1

    const timingInfoPresentFlag = reader.read(1)
    if (timingInfoPresentFlag) {
      reader.skip(64)
      const equalPictureInterval = reader.read(1)
      if (equalPictureInterval) {
        reader.skipUvlc()
      }

      decoderModelInfoPresentFlag = reader.read(1)
      if (decoderModelInfoPresentFlag) {
        bufferDelayLengthMinus1 = reader.read(5)
        reader.skip(42)
      }
    } else {
      decoderModelInfoPresentFlag = 0
    }

    const initialDisplayDelayPresentFlag = reader.read(1)
    const operatingPointsCntMinus1 = reader.read(5)
    for (let i = 0; i <= operatingPointsCntMinus1; ++i) {
      reader.skip(12)
      const seqLevelIdx = reader.read(5)
      const seqTier = seqLevelIdx > 7 && reader.readBool()
      if (i === 0) {
        seqLevelIdx0 = seqLevelIdx
        seqTier0 = seqTier
      }

      if (decoderModelInfoPresentFlag) {
        const decoderModelPresentForThisOp = reader.read(1)
        if (decoderModelPresentForThisOp) {
          const n = bufferDelayLengthMinus1! + 1
          reader.skip(n + n + 1)
        }
      }

      if (initialDisplayDelayPresentFlag) {
        const initialDisplayDelayPresentForThisOp = reader.read(1)
        if (initialDisplayDelayPresentForThisOp) {
          const initialDisplayDelayMinus1 = reader.read(4)
          if (i === 0) {
            initialPresentationDelay = initialDisplayDelayMinus1 + 1
          }
        }
      }
    }

    const frameWidthBitsMinus1 = reader.read(4)
    const frameHeightBitsMinus1 = reader.read(4)

    reader.skip(frameWidthBitsMinus1 + frameHeightBitsMinus1 + 2)

    const frameIdNumbersPresentFlag = reader.read(1)
    if (frameIdNumbersPresentFlag) {
      reader.skip(7)
    }

    reader.skip(7)

    const enableOrderHint = reader.read(1)
    if (enableOrderHint) {
      reader.skip(2)
    }

    const seqChooseScreenContentTools = reader.read(1)
    const seqForceScreenContentTools = seqChooseScreenContentTools
      ? SELECT_SCREEN_CONTENT_TOOLS
      : reader.read(1)

    if (seqForceScreenContentTools > 0) {
      const seqChooseIntegerMv = reader.read(1)
      if (!seqChooseIntegerMv) {
        reader.skip(1)
      }
    }

    if (enableOrderHint) {
      reader.skip(3)
    }

    reader.skip(3)
    colorConfigData = colorConfig()
  }

  return {
    ...colorConfigData,
    profile: seqProfile as 0 | 1 | 2,
    levelIdx0: seqLevelIdx0,
    seqTier0,
    highBitdepth,
    twelveBit,
    monochrome,
    chromaSubsamplingX,
    chromaSubsamplingY,
    chromaSamplePosition,
    initialPresentationDelay,
  }
}

export function getSeqFromOBU(data: Uint8Array) {
  for (let i = 0; i < data.length;) {
    const obuHeader = data[i]!
    i += 1
    if (obuHeader & 0b100) {
      if (i >= data.length) {
        throw TypeError('Truncated OBU extension header')
      }
      i += 1
    }
    if (!(obuHeader & 0b10)) {
      throw TypeError('OBU has no size field')
    }

    let size = 0
    let shift = 0
    for (;;) {
      if (i >= data.length) {
        throw TypeError('Truncated OBU size')
      }

      const byte = data[i++]!
      size += (byte & 0x7f) * 2 ** shift
      if (!Number.isSafeInteger(size)) {
        throw TypeError('Too large OBU size')
      }

      if (!(byte & 0x80)) break
      shift += 7
    }
    if (i + size > data.length) {
      throw TypeError('Truncated OBU payload')
    }

    if (((obuHeader >> 3) & 0xf) !== 1) {
      i += size
      continue
    }
    return data.subarray(i, i + size)
  }

  throw TypeError('Cannot find AV1 sequence header from OBU stream')
}
