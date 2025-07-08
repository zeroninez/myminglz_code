// packages/api/tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true, // 🔥 이거를 true로 변경!
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["@supabase/supabase-js"],
  target: "es2020",
});
