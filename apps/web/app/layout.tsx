import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { Providers } from './providers'
import { cn } from '@/lib/utils'
import './globals.css'

const notoSansKR = Noto_Sans_KR()

const bodyClass = cn(
  notoSansKR.className,
  'bg-background text-foreground antialiased',
)

export const metadata: Metadata = {
  title: {
    default: 'Mini Profile',
    template: '%s | Mini Profile',
  },
  description: '프로필 사진을 저용량으로 압축해줍니다.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='ko' suppressHydrationWarning>
      <body className={bodyClass}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
