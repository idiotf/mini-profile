import type { MaybePromise, Source } from 'mediabunny'

const magicBytes: Record<string, number[][][]> = {
  png: [[[0x89], [0x50], [0x4e], [0x47], [0x0d], [0x0a], [0x1a], [0x0a]]],
  jpeg: [
    [[0xFF], [0xD8], [0xFF], [0xDB, 0xEE, 0xE0]],
    [
      [0xFF],
      [0xD8],
      [0xFF],
      [0xE0],
      [0x00],
      [0x10],
      [0x4A],
      [0x46],
      [0x49],
      [0x46],
      [0x00],
      [0x01],
    ],
    [
      [0xFF],
      [0xD8],
      [0xFF],
      [0xE1],
      [],
      [],
      [0x45],
      [0x78],
      [0x69],
      [0x66],
      [0x00],
      [0x00],
    ],
  ],
  gif: [[[0x47], [0x49], [0x46], [0x38], [0x37, 0x39], [0x61]]],
  webp: [[
    [0x52],
    [0x49],
    [0x46],
    [0x46],
    [],
    [],
    [],
    [],
    [0x57],
    [0x45],
    [0x42],
    [0x50],
  ]],
  avif: [[
    [],
    [],
    [],
    [],
    [0x66],
    [0x74],
    [0x79],
    [0x70],
    [0x61],
    [0x76],
    [0x69],
    [0x66, 0x73],
  ]],
}

interface ReadResult {
	bytes: Uint8Array
	view: DataView
	/** The offset of the bytes in the file. */
	offset: number
}

interface SourceWithReader extends Source {
  _read(
		start: number,
		end: number,
		minReadPosition: number,
		maxReadPosition: number,
	): MaybePromise<ReadResult | null>
}

export async function readImageMimeType(source: Source) {
  const slice = await (source as SourceWithReader)._read(0, 12, 0, Infinity)
  if (!slice) return null

  for (const type in magicBytes) {
    const expectedMagicByte = magicBytes[type]!
    const isMatch = expectedMagicByte.some(
      (bytePattern) => bytePattern.every(
        (byte, i) => !byte.length || byte.includes(slice.bytes[i]!),
      ),
    )
    if (isMatch) return 'image/' + type
  }
  return null
}
