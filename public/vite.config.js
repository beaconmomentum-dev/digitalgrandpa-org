import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const foundationScript = {
  name: 'digital-grandpa-foundation-script',
  enforce: 'pre',
  transformIndexHtml(html) {
    return html.replaceAll(
      '<script src="dg-foundation.js" defer></script>',
      '<script src="/dg-foundation.js" defer></script>',
    )
  },
}

export default defineConfig({
  publicDir: path.resolve(__dirname, 'static'),
  plugins: [foundationScript],
  build: {
    rollupOptions: {
      input: {
        home: path.resolve(__dirname, 'index.html'),
        fieldNotes: path.resolve(__dirname, 'field-notes.html'),
        stories: path.resolve(__dirname, 'stories.html'),
        resources: path.resolve(__dirname, 'resources.html'),
        about: path.resolve(__dirname, 'about.html'),
        support: path.resolve(__dirname, 'support.html'),
        theWorkYouStillCarry: path.resolve(__dirname, 'the-work-you-still-carry.html'),
        porchLightPolicies: path.resolve(__dirname, 'porch-light-policies.html'),
      },
    },
  },
})
