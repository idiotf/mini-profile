import { FullBox } from '../box-base'

export class Url extends FullBox {
  constructor(location?: string) {
    const flags = location === undefined ? 1 : 0
    const data = new TextEncoder().encode(
      location !== undefined ? location + '\0' : undefined,
    )
    super('url ', 0, flags, data)
  }
}

export function url(location?: string) {
  return new Url(location)
}
