import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Tambahkan konfigurasi manual di sini
  // {
  //   files: ["**/*.ts", "**/*.tsx"],
  //   rules: {
  //     "no-warning-comments": "off",
  //     "@typescript-eslint/no-unused-vars": "off", // atau "warn"
  //   },
  // },
];

export default eslintConfig;
