import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(','),
  turbopack: {
    root: path.join(import.meta.dirname, '../..'),
  },
}

export default nextConfig
