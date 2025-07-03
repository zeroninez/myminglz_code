/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/api", "@repo/ui"],
  experimental: {
    externalDir: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

module.exports = nextConfig;
