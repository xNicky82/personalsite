import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  // Keep the headless-Chromium packages (used by the /contracts PDF route)
  // out of the server bundle so their native/binary assets resolve at runtime.
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  // Force the ENTIRE @sparticuz/chromium package (the chromium binary *and* its
  // bundled shared libraries — libnss3.so etc.) into the serverless function.
  // Without this, Next's file tracer ships only the binary and the launch fails
  // with "libnss3.so: cannot open shared object file" on Vercel.
  outputFileTracingIncludes: {
    '/contracts/download': ['./node_modules/@sparticuz/chromium/**/*'],
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

export default withMDX(nextConfig);
