/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // 静的なHTMLファイルを生成するための設定
  basePath: process.env.NODE_ENV === 'production' ? '/oikochu' : '',
  // APIルートを使用しているものを除外する
  exportPathMap: async function (defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
    return Object.fromEntries(
      Object.entries(defaultPathMap).filter(
        ([path]) => !path.startsWith('/api/')
      )
    );
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "replicate.com",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  distDir: ".next",
  swcMinify: true,
};

export default nextConfig;
