import { isDict } from './is-dict'

function fallbackArrays(...arrs: unknown[]) {
  for (const arr of arrs) {
    if (Array.isArray(arr) && arr.length !== 0) {
      return arr
    }
  }

  return []
}

const knownOS: [type: string, pattern: RegExp][] = [
  ['Windows', /Windows NT 10\.0/],
  ['Android', /Android/],
  ['iOS', /iPhone|iPad|iPod/],
  ['macOS', /Mac OS X/],
  ['Linux', /Linux/],
]

const knownBrowserBrand: [type: string, pattern: string][] = [
  ['Edge', 'Microsoft Edge'],
  ['Opera', 'Opera'],
  ['Chrome', 'Google Chrome'],
  ['Chromium', 'Chromium'],
]

const knownBrowserUA: [type: string, pattern: RegExp][] = [
  ['Samsung Internet', /SamsungBrowser\/([\d.]+)/],
  ['Edge', /(?:EdgA?|EdgiOS)\/([\d.]+)/],
  ['Opera', /(?:OPR|Opera)\/([\d.]+)/],
  ['Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/],
  ['Chrome', /(?:Chrome|CriOS)\/([\d.]+)/],
  ['Safari', /Version\/([\d.]+).*Safari/],
]

interface TypeAndVersion {
  type: string | null
  version: string | null
}

export interface UserAgent {
  os: TypeAndVersion
  browser: TypeAndVersion
}

export async function queryUserAgent(): Promise<UserAgent> {
  const ua = navigator.userAgent
  const uaData =
    'userAgentData' in navigator && isDict(navigator.userAgentData)
      ? navigator.userAgentData
      : null

  const hints =
    typeof uaData?.getHighEntropyValues == 'function'
      ? await uaData.getHighEntropyValues([
          'platformVersion',
          'fullVersionList',
        ])
      : null

  const os: TypeAndVersion = {
    type: null,
    version: hints?.platformVersion || null,
  }

  const browser: TypeAndVersion = {
    type: null,
    version: null,
  }

  if (typeof uaData?.platform == 'string' && uaData.platform !== '') {
    os.type = uaData.platform
  } else {
    const known = knownOS.find(([, pattern]) => pattern.test(ua))
    if (known) {
      os.type = known[0]
    }
  }

  const brands = fallbackArrays(hints?.fullVersionList, uaData?.brands)
  for (const [type, pattern] of knownBrowserBrand) {
    const brand = brands.find((v) => v.brand === pattern)
    if (brand) {
      browser.type = type
      browser.version = brand.version
      break
    }
  }

  if (!browser.type) {
    for (const [type, pattern] of knownBrowserUA) {
      const match = ua.match(pattern)
      if (match) {
        browser.type = type
        browser.version = match[1] || null
        break
      }
    }
  }

  return { os, browser }
}
