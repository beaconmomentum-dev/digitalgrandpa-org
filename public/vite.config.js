import { defineConfig } from 'vite'
import fs from 'node:fs'
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

const sitewideMetadataAssets = {
  name: 'digital-grandpa-stable-metadata-assets',
  generateBundle() {
    const assets = [
      'manifest.json',
      'digital-grandpa-mark.svg',
      'favicon.svg',
      'digital-grandpa-mark-source.webp',
      'favicon.ico',
      'favicon.png',
      'favicon.webp',
      'favicon-16.png',
      'favicon-32.png',
      'favicon-48.png',
      'apple-touch-icon.png',
      'icon-192.png',
      'icon-512.png',
      'icon-192.ico',
      'icon-512.ico',
      'images/digital-grandpa-social-preview.png',
      'images/digital-grandpa-social-preview.svg',
    ]
    for (const file of assets) {
      this.emitFile({
        type: 'asset',
        fileName: file,
        source: fs.readFileSync(path.resolve(__dirname, file)),
      })
    }
  },
}

export default defineConfig({
  publicDir: path.resolve(__dirname, 'static'),
  plugins: [foundationScript, sitewideMetadataAssets],
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
