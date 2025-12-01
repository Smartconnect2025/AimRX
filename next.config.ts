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
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
          // Comprehensive Content Security Policy - Allow all HTTPS sources
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: http:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors https://*.specode.ai http://localhost:*",
          },
        ],
      },
      // Add specific headers for RSC requests
      {
        source: "/:path*/_rsc",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
      {
        source: "/:path*",
        has: [{ type: "query", key: "_rsc" }],
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
  // See more detailed errors
  reactStrictMode: true,
};

export default nextConfig;
