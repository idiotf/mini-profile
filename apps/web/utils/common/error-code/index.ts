import { queryUserAgent } from '../user-agent'

export interface ErrorDetails {
  fileFormat: string
}

function serializeError(
  error: unknown,
  visitedErrorObj = new Set<Error>(),
): unknown {
  if (error instanceof Error) {
    try {
      visitedErrorObj.add(error)
      return visitedErrorObj.has(error.cause as Error) ||
        error.cause === undefined
        ? [error.stack]
        : [error.stack, serializeError(error.cause, new Set(visitedErrorObj))]
    } catch (e) {
      console.warn('An error occurred when serializing Error object:', e)
      return [error.stack]
    }
  }

  try {
    return JSON.parse(JSON.stringify(error))
  } catch (e) {
    console.warn('An error occurred when serializing value:', e)
    return String(error)
  }
}

export async function generateErrorCode(error: unknown, details: ErrorDetails) {
  const { os, browser } = await queryUserAgent()

  return JSON.stringify([
    [os.type, os.version],
    [browser.type, browser.version],
    serializeError(error),
    details.fileFormat,
  ])
}
