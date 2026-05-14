import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Admin dashboard is fully client-side; the useEffect→fetch→setState
  // pattern is used uniformly across every data page. The newer
  // react-hooks/set-state-in-effect + react-hooks/purity rules
  // (eslint-plugin-react-hooks v6) are overly strict for this architecture.
  // Refactoring every page to TanStack Query / RSC is out of scope.
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
