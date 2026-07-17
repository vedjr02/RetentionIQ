/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // On Vercel, root vercel.json routes /api/* to the backend service.
    if (process.env.VERCEL) {
      return [];
    }

    // Local `next start` / `next dev`: proxy API calls to FastAPI on :8000
    // so production builds work without NEXT_PUBLIC_API_URL set.
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
      {
        source: "/health",
        destination: "http://127.0.0.1:8000/health",
      },
    ];
  },
};

export default nextConfig;
