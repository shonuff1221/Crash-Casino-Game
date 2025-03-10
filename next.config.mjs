import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'styles')], // __dirname is not available in ES modules, using process.cwd() as an alternative
  },
};

export default nextConfig;