import type { NextConfig } from 'next';
import packageJson from './package.json';

const securityHeaders = [
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: ws: wss:; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  },
];

const ERDB_BUILD_NAME =
  String(process.env.ERDB_BUILD_NAME || process.env.npm_package_name || packageJson.name || 'erdb').trim() || 'erdb';
const ERDB_BUILD_VERSION =
  String(process.env.ERDB_BUILD_VERSION || process.env.npm_package_version || packageJson.version || '1.0').trim() ||
  '1.0';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    ERDB_BUILD_NAME,
    ERDB_BUILD_VERSION,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  transpilePackages: ['motion'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
