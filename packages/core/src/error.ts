export type CompressionExceptionType = keyof typeof exceptionMsgs
const exceptionMsgs = {
  unsupportedFormat: '지원되지 않는 파일 형식입니다.',
  noImageTracks: '이미지 트랙이 존재하지 않습니다.',
} satisfies Record<string, string>

export class CompressionException extends Error {
  override name = 'CompressionException'

  constructor(
    public type: CompressionExceptionType,
    message = exceptionMsgs[type],
  ) {
    super(message)
  }
}

export type CompressionErrorType = keyof typeof errorMsgs
const errorMsgs = {
  cannotReadFile: '파일 읽기 실패. 파일을 다시 추가해주세요.',
  cannotInitVideoConversion: '비디오 변환 초기화를 실패했습니다.',
  invalidVideoConversion:
    '입력 또는 출력 파일의 비디오 형식이 지원되지 않습니다.',
  cannotInitImageDecoder: '이미지 디코딩 준비를 실패했습니다.',
} satisfies Record<string, string>

export class CompressionError extends Error {
  override name = 'CompressionError'

  constructor(
    public type: CompressionErrorType,
    error: unknown,
    message = errorMsgs[type],
  ) {
    super(message, { cause: error })
  }
}
