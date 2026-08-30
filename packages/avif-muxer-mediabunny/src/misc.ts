export function buildAvifMimeType(codecStrings: string[]) {
  let string = 'image/avif'

  const uniqueCodecMimeTypes = [...new Set(codecStrings)]
  if (uniqueCodecMimeTypes.length > 0) {
    string += `; codecs="${uniqueCodecMimeTypes.join(', ')}"`
  }

  return string
}
