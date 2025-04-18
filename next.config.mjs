/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // 静的なHTMLファイルを生成するための設定
  basePath: process.env.NODE_ENV === 'production' ? '/oikochu' : '',
  images: {
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
    unoptimized: true,
  },
  distDir: ".next",
  swcMinify: true,
};

export default nextConfig;
