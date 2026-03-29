import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { paraglideVitePlugin } from '@inlang/paraglide-js'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    paraglideVitePlugin({
      project: './src/libs/paraglide/project.inlang',
      outdir: './src/libs/paraglide/generated',
      strategy: ['globalVariable', 'baseLocale'],
    }),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/posthog-js/')) return 'vendor-posthog'
          if (id.includes('/@tabler/icons-react/')) return 'vendor-icons'
          if (id.includes('/zod/')) return 'vendor-zod'
          if (id.includes('/recharts/') || id.includes('/d3-shape') || id.includes('/d3-scale') || id.includes('/d3-color') || id.includes('/d3-interpolate') || id.includes('/d3-path') || id.includes('/victory-vendor/')) return 'vendor-charts'
        },
      },
    },
  },
  environments: {
    ssr: {
      resolve: {
        external: ['better-auth', 'drizzle-orm', 'pg', '@node-rs/argon2', '@node-rs/bcrypt'],
      },
    },
  },
})

export default config
