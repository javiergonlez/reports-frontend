import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
    }),
  ],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  define: {
    // Make environment variables available to the client
    'process.env': {}
  }
})
