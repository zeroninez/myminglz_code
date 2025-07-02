import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: false, // DTS 생성 비활성화
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["@supabase/supabase-js"],
  target: "es2020",
});
