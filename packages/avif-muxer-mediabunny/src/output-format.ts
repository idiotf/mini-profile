import {
  IsobmffOutputFormat,
  type IsobmffOutputFormatOptions,
  type MediaCodec,
} from 'mediabunny'
import {
  createCustomOutputFormat,
  type Output,
} from '@mini-profile/mediabunny-custom-format'
import { AvifMuxer } from './muxer'

export interface AvifOutputFormatOptions extends IsobmffOutputFormatOptions {
  useSingleImage?: boolean
  repetitionCount?: number
}

export class AvifOutputFormat extends createCustomOutputFormat(
  IsobmffOutputFormat,
) {
  constructor(
    /** @internal */
    public _options: AvifOutputFormatOptions = {},
  ) {
    super(_options)
  }

  get name() {
    return 'AVIF'
  }

  get fileExtension() {
    return '.avif'
  }

  get mimeType() {
    return 'image/avif'
  }

  getSupportedCodecs(): MediaCodec[] {
    return ['av1']
  }

  createMuxer(output: Output) {
    return new AvifMuxer(output, this)
  }
}
