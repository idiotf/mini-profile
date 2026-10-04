export function buildAvifMimeType(codecStrings: string[]) {
  let string = 'image/avif'

  const uniqueCodecMimeTypes = [...new Set(codecStrings)]
  if (uniqueCodecMimeTypes.length > 0) {
    string += `; codecs="${uniqueCodecMimeTypes.join(', ')}"`
  }

  return string
}

export function approximateRational(x: number, maxDen: number) {
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x)

  let prevNum = 0, prevDen = 1
  let currNum = 1, currDen = 0

  for (;;) {
    const int = Math.floor(x)
    const nextNum = int * currNum + prevNum
    const nextDen = int * currDen + prevDen
    if (nextDen > maxDen) break

    prevNum = currNum
    prevDen = currDen
    currNum = nextNum
    currDen = nextDen

    x = 1 / (x - int)
    if (!Number.isFinite(x)) break
  }

  return {
    num: sign * currNum,
    den: currDen,
  }
}

export interface RleData<T> {
  value: T
  count: number
}

export function rle<T>(arr: T[]): RleData<T>[] {
  const rleArr: RleData<T>[] = []

  for (const value of arr) {
    if (
      rleArr.length === 0 ||
      !Object.is(rleArr[rleArr.length - 1]!.value, value)
    ) {
      rleArr.push({
        value,
        count: 1,
      })
    } else {
      rleArr[rleArr.length - 1]!.count += 1
    }
  }

  return rleArr
}

export function sumAndRoundDelta(deltaList: number[]) {
  let sum = 0, sumRound = 0
  const deltaArr: number[] = []

  for (const delta of deltaList) {
    const prevSumRound = sumRound
    sumRound = Math.round((sum += delta))
    deltaArr.push(sumRound - prevSumRound)
  }

  return deltaArr
}
