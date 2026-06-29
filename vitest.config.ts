import { defineConfig } from "vitest/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

// Resuelve el alias `@/...` de tsconfig (paths) para los tests; el regex `^@/`
// evita capturar paquetes scoped como `@supabase/...`.
export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: `${root}/` }],
  },
});
