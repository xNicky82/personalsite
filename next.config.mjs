import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  // Keep the headless-Chromium packages (used by the /contracts PDF route)
  // out of the server bundle. The Chromium browser pack (binary + shared
  // libraries) is fetched at runtime from a URL by @sparticuz/chromium-min, so
  // nothing binary needs to be bundled or file-traced.
  serverExternalPackages: ['@sparticuz/chromium-min', 'puppeteer-core'],
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

export default withMDX(nextConfig);
