import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 過渡期直接搬進來的舊站第三方套件（jQuery / bootstrap / bsnav / slick /
    // fancybox / aos / gsap legacy）跟 coreScript.js，不是專案原始碼，不用 lint。
    "public/**",
  ]),
]);

export default eslintConfig;
