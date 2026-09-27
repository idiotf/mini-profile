import { OutputFormat } from 'mediabunny'
import type { Muxer, Output } from './mediabunny-internals'

export function createCustomOutputFormat<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends abstract new (...args: any[]) => OutputFormat,
>(superCtor: T) {
  abstract class CustomOutputFormat extends superCtor {
    protected abstract get name(): string
    protected abstract createMuxer(output: Output): Muxer

    /** @internal */
    get _name() {
      return this.name
    }

    /** @internal */
    _createMuxer(output: Output) {
      return this.createMuxer(output)
    }

    protected createSuperMuxer(output: Output): Muxer {
      // @ts-expect-error Use internal property explicitly
      return super._createMuxer(output)
    }
  }

  return CustomOutputFormat
}

export abstract class CustomOutputFormat extends createCustomOutputFormat(
  OutputFormat,
) {}
