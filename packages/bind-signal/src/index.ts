export function withSignal<T, TPromise extends PromiseLike<T>>(
  promise: PromiseLike<T> & TPromise,
  signal: AbortSignal | undefined,
  onAbort?: (reason: unknown, originalPromise: TPromise) => void,
) {
  return new Promise<T>((resolve, reject) => {
    if (!signal) return resolve(promise)

    const handleAbort = () => {
      try {
        onAbort?.(signal.reason, promise)
        reject(signal.reason)
      } catch (e) {
        reject(SuppressedError(e, signal.reason))
      }
    }

    if (signal.aborted) return queueMicrotask(handleAbort)
    signal.addEventListener('abort', handleAbort, { once: true })

    promise.then(
      (value) => {
        resolve(value)
        signal.removeEventListener('abort', handleAbort)
      },
      (reason) => {
        reject(reason)
        signal.removeEventListener('abort', handleAbort)
      },
    )
  })
}

interface SignalBinding extends Disposable {
  <T>(
    promise: PromiseLike<T>,
    onDispose?: (value: T) => void,
  ): Promise<T>

  <T>(
    value: T,
    onDispose?: (value: T) => void,
  ): T

  get disposed(): boolean
  sub(): SignalBinding
  dispose(): void
}

function isObject(value: unknown) {
  return !!(value && typeof value == 'object')
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return isObject(value) && 'then' in value && typeof value.then == 'function'
}

const alreadyDisposedError = ReferenceError('bindSignal: already disposed')

export function bindSignal(signal: AbortSignal | undefined): SignalBinding {
  const stack = new DisposableStack()

  return Object.assign(
    <T>(
      value: T | PromiseLike<T>,
      onDispose?: (value: T) => void,
    ) => {
      function dispose(value: T) {
        if (onDispose) {
          onDispose(value)
        } else {
          const dispose = (value as Disposable)?.[Symbol.dispose]
          if (typeof dispose == 'function') Reflect.apply(dispose, value, [])
        }
      }

      function handleSyncValue(value: T) {
        // TODO: improve structure of try-catch nesting

        if (stack.disposed) {
          try {
            if (signal?.aborted) {
              try {
                dispose(value)
              } catch (e) {
                throw SuppressedError(e, signal.reason)
              }
              throw signal.reason
            } else {
              dispose(value)
            }
          } catch (e) {
            throw SuppressedError(e, alreadyDisposedError)
          }
          throw alreadyDisposedError
        } else if (signal?.aborted) {
          try {
            dispose(value)
          } catch (e) {
            throw SuppressedError(e, signal.reason)
          }
          throw signal.reason
        }

        return stack.adopt(value, dispose)
      }

      if (isPromiseLike(value)) {
        if (stack.disposed) {
          value.then(dispose)

          if (signal?.aborted) {
            throw SuppressedError(signal.reason, alreadyDisposedError)
          } else {
            throw alreadyDisposedError
          }
        }

        const raceSignal = signal && AbortSignal.any([
          signal,
          stack.adopt(
            new AbortController(),
            (controller) => controller.abort(alreadyDisposedError),
          ).signal,
        ])

        return withSignal(
          value,
          raceSignal,
          () => value.then(dispose),
        ).then(handleSyncValue)
      } else {
        return handleSyncValue(value)
      }
    },
    {
      get disposed() {
        return !!(stack.disposed || signal?.aborted)
      },

      sub() {
        return stack.use(bindSignal(signal))
      },

      dispose() {
        stack.dispose()
      },

      [Symbol.dispose]() {
        this.dispose()
      },
    },
  )
}
