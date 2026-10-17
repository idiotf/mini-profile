import { useCallback } from 'react'
import { CompressionException, CompressionError } from '@mini-profile/core'
import { generateErrorCode, type ErrorDetails } from '@/utils/common/error-code'
import { CopyButton, CopyButtonIcon } from '../ui/copy-button'

export interface ErrorInfoProps {
  error: unknown
  details: ErrorDetails
}

export function ErrorInfo({ error, details }: ErrorInfoProps) {
  const isUnexpectedError =
    typeof error != 'string' && !(error instanceof CompressionException)

  const generateCode = useCallback(() => {
    return generateErrorCode(error, details)
  }, [error, details])

  return (
    <span className='flex-1 overflow-hidden'>
      <div className='flex w-full scrollbar-none items-center overflow-x-auto overflow-y-hidden'>
        {isUnexpectedError && (
          <span className='flex items-center gap-0.5'>
            <CopyButton
              value={generateCode}
              variant='link'
              size='2xs'
              className='pl-0 text-blue-500'
            >
              <CopyButtonIcon />
              오류 복사
            </CopyButton>
          </span>
        )}
        <span>
          {typeof error == 'string'
            ? error
            : error instanceof CompressionException ||
                error instanceof CompressionError
              ? error.message
              : '예기치 않은 오류가 발생했습니다.'}
        </span>
      </div>
    </span>
  )
}
