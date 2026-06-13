import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Enable strict TypeScript — removes ignoreBuildErrors for production quality
  typescript: {
    ignoreBuildErrors: false,
  },

  // Enable React strict mode for catching bugs early
  reactStrictMode: true,

  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Compiler optimizations: remove console.log in production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  // Webpack: move heavy ML libraries to a separate async chunk
  // so they don't block initial page load
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...(config.optimization.splitChunks || {}),
          cacheGroups: {
            // Isolate TensorFlow + face-api into their own lazy chunk
            mlLibs: {
              test: /[\\/]node_modules[\\/](face-api\.js|@tensorflow)[\\/]/,
              name: "ml-libs",
              chunks: "async",   // async = only loaded on demand
              priority: 30,
              reuseExistingChunk: true,
            },
            // Isolate framer-motion into its own chunk
            framerMotion: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: "framer-motion",
              chunks: "async",
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },

  // HTTP headers for security and performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Security headers
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // Content Security Policy: restrict sources to prevent XSS at HTTP level
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval'",   // unsafe-eval needed for TensorFlow WASM
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "media-src 'self' blob:",             // blob: for camera/mic streams
              "connect-src 'self'",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      {
        // Cache face-api.js model files aggressively (they never change)
        source: "/models/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache static assets for 1 week
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
