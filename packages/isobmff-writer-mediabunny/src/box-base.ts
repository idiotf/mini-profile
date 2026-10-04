import {
  hasNonAsciiCharacters,
  writeAscii,
  isU8,
  isU24,
  writeU24,
} from './utils'

export function box(type: string, data: Uint8Array) {
  return new Box(type, data)
}

export class Box {
  constructor(
    /**
     * Declare the type of this box in 4bytes ascii
     */
    type: string,
    /**
     * Declare the payload
     */
    boxData: Uint8Array,
  )

  constructor(
    public readonly type: string,
    public boxData: Uint8Array,
  ) {
    if (type.length !== 4) {
      throw TypeError('The type of box must be 4bytes; received ' + type)
    }
    if (hasNonAsciiCharacters(type)) {
      throw TypeError(
        'The type of box must only include ascii characters; received ' + type,
      )
    }
  }

  private mustUseExtendedSize(canUseZeroSize: boolean) {
    return !canUseZeroSize && this.boxData.byteLength + 8 > 0xff_ff_ff_ff
  }

  getSizeHeaderSize(canUseZeroSize: boolean) {
    if (this.mustUseExtendedSize(canUseZeroSize)) {
      // largesize
      return 4 + 8
    }

    return 4
  }

  getHeaderSize(canUseZeroSize = false) {
    return this.getSizeHeaderSize(canUseZeroSize) + 4
  }

  getSize(canUseZeroSize?: boolean) {
    return this.getHeaderSize(canUseZeroSize) + this.boxData.byteLength
  }

  getEncodedData(canUseZeroSize = false) {
    const arr = new Uint8Array(this.getSize(canUseZeroSize))
    const view = new DataView(arr.buffer)

    const mustUseExtendedSize = this.mustUseExtendedSize(canUseZeroSize)
    view.setUint32(
      0,
      canUseZeroSize ? 0 : mustUseExtendedSize ? 1 : view.byteLength,
    )
    writeAscii(view, 4, this.type)

    if (mustUseExtendedSize) {
      view.setBigUint64(8, BigInt(view.byteLength))
      arr.set(this.boxData, 16)
    } else {
      arr.set(this.boxData, 8)
    }

    return arr
  }
}

export function fullBox(
  type: string,
  version: number,
  flags: number,
  data: Uint8Array,
) {
  return new FullBox(type, version, flags, data)
}

export class FullBox extends Box {
  constructor(
    /**
     * Declare the type of this box in 4bytes ascii
     */
    type: string,
    public readonly version: number,
    public readonly flags: number,
    /**
     * Declare the payload
     */
    public readonly fullBoxData: Uint8Array,
  ) {
    if (!isU8(version)) {
      throw TypeError(
        'The version of full box must have type of u8; received ' + version,
      )
    }

    if (!isU24(flags)) {
      throw TypeError(
        'The flags of full box must have type of u24; received ' + flags,
      )
    }

    const boxData = new Uint8Array(1 + 3 + fullBoxData.byteLength)
    const view = new DataView(boxData.buffer)
    view.setUint8(0, version)
    writeU24(view, 1, flags)
    boxData.set(fullBoxData, 4)
    super(type, boxData)
  }
}

export function concatBoxes(boxes: Box[], useZeroSize?: boolean) {
  const boxDataPeers = boxes.map((box, i) => {
    const canUseZeroSize = useZeroSize && i === boxes.length - 1
    return [box, box.getSize(canUseZeroSize), !!canUseZeroSize] as const
  })

  const totalSize = boxDataPeers.reduce((acc, [, size]) => acc + size, 0)
  const data = new Uint8Array(totalSize)

  let pos = 0
  for (const [box, size, isLastBox] of boxDataPeers) {
    data.set(box.getEncodedData(isLastBox), pos)
    pos += size
  }

  return data
}

export class ContainerBox extends Box {
  constructor(
    type: string,
    boxes: Box[],
    beforeBoxes?: Uint8Array,
    useZeroSize?: boolean,
  ) {
    const concatData = concatBoxes(boxes, useZeroSize)
    if (beforeBoxes) {
      const data = new Uint8Array(
        beforeBoxes.byteLength + concatData.byteLength,
      )
      data.set(beforeBoxes, 0)
      data.set(concatData, beforeBoxes.byteLength)

      super(type, data)
    } else {
      super(type, concatData)
    }
  }
}

export function containerBox(
  type: string,
  boxes: Box[],
  beforeBoxes?: Uint8Array,
  useZeroSize?: boolean,
) {
  return new ContainerBox(type, boxes, beforeBoxes, useZeroSize)
}

export class FullContainerBox extends FullBox {
  constructor(
    type: string,
    version: number,
    flags: number,
    boxes: Box[],
    beforeBoxes?: Uint8Array,
    useZeroSize?: boolean,
  ) {
    const concatData = concatBoxes(boxes, useZeroSize)
    if (beforeBoxes) {
      const data = new Uint8Array(
        beforeBoxes.byteLength + concatData.byteLength,
      )
      data.set(beforeBoxes, 0)
      data.set(concatData, beforeBoxes.byteLength)

      super(type, version, flags, data)
    } else {
      super(type, version, flags, concatData)
    }
  }
}

export function fullContainerBox(
  type: string,
  version: number,
  flags: number,
  boxes: Box[],
  beforeBoxes?: Uint8Array,
  useZeroSize?: boolean,
) {
  return new FullContainerBox(
    type,
    version,
    flags,
    boxes,
    beforeBoxes,
    useZeroSize,
  )
}
