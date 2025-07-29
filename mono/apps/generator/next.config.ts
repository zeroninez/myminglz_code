import { NextConfig } from "next";
import path from "path";
import * as dotenv from "dotenv";

// .env.local 파일 로드
dotenv.config({
  path: path.resolve(__dirname, '.env.local')
});

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/api", "@repo/ui"],
  experimental: {
    externalDir: true,
  },
  env: {
    NOTION_API_KEY: process.env.NOTION_API_KEY,
    NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
