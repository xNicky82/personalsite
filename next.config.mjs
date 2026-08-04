import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  // Keep the headless-Chromium packages (used by the /contracts PDF route)
  // out of the server bundle so their native/binary assets resolve at runtime.
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

export default withMDX(nextConfig);
