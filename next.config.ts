import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.up.railway.app",
    "*.app-dev.specode.ai",
    "*.app.specode.ai",
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow images from Supabase Storage (local and production)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54323",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54323",
      },
    ],
  },
  // CORS headers to all API routes and pages
  async headers() {
    return [
      {
        // Apply to all routes
        // Note: CORS Access-Control-Allow-Origin is handled dynamically in middleware.ts
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
          // Comprehensive Content Security Policy - Allow all HTTPS sources
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: http:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors https://*.specode.ai http://localhost:*",
          },
        ],
      },
    ];
  },
  // See more detailed errors
  reactStrictMode: true,
};

export default nextConfig;
