import { Box } from '../box-base'
import { isU4, isU5 } from '../utils'

export interface Av1Config {
  profile: 0 | 1 | 2
  levelIdx0: number

  seqTier0: boolean
  highBitdepth: boolean
  twelveBit: boolean
  monochrome: boolean
  chromaSubsamplingX: boolean
  chromaSubsamplingY: boolean
  chromaSamplePosition: 0 | 1 | 2 | 3

  initialPresentationDelay?: number
}

export class Av1C extends Box {
  constructor(av1Config: Av1Config) {
    if (!isU5(av1Config.levelIdx0)) {
      throw TypeError(
        'The level_idx_0 of av1C must have type of u5; received ' +
          av1Config.levelIdx0,
      )
    }

    if (
      av1Config.initialPresentationDelay !== undefined &&
      !isU4(av1Config.initialPresentationDelay - 1)
    ) {
      throw TypeError(
        'The initial_presentation_delay of av1C must be in range 1~16; received ' +
          av1Config.initialPresentationDelay,
      )
    }

    const data = new Uint8Array(4)
    const view = new DataView(data.buffer)
    view.setUint8(0, 0x81)
    view.setUint8(1, (av1Config.profile << 5) | av1Config.levelIdx0)
    view.setUint8(
      2,
      (+av1Config.seqTier0 << 7) |
        (+av1Config.highBitdepth << 6) |
        (+av1Config.twelveBit << 5) |
        (+av1Config.monochrome << 4) |
        (+av1Config.chromaSubsamplingX << 3) |
        (+av1Config.chromaSubsamplingY << 2) |
        av1Config.chromaSamplePosition,
    )
    view.setUint8(
      3,
      av1Config.initialPresentationDelay === undefined
        ? 0
        : 0x1_0000 | (av1Config.initialPresentationDelay - 1),
    )

    super('av1C', data)
  }
}

export function av1C(av1Config: Av1Config) {
  return new Av1C(av1Config)
}
