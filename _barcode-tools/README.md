# Barcode Tools

A small, mobile-first web app for reading and creating QR codes, Code 128, and standard Code 39. Built with plain JavaScript and CSS; no frontend framework, backend, accounts, analytics, or saved barcode history.

Production URL: https://craigvillacorta.github.io/barcode-tools/

## Local development

Requires Node.js 20.19+ (or 22.12+).

```sh
npm ci
npm run dev
```

Open the printed URL with `/barcode-tools/` appended. For the production build:

```sh
npm test
npm run build
npm run preview
```

`npm run icons` regenerates the included home-screen icons. All runtime dependencies are bundled into the build; there are no CDN dependencies or web fonts.

## Behavior

- Read starts the rear-facing camera when available and stops after one successful scan. It shows the detected format and exact decoded contents, with Copy contents and Scan again actions. It never opens scanned links automatically.
- Leaving the Read tab, stopping the camera, hiding the app, or leaving the page releases the camera. Cancelling during camera permission startup discards any late-arriving stream.
- Create preserves entered contents. Standard Code 39 validates uppercase letters, digits, spaces, and `- . $ / + %`. Code 128 accepts ASCII, up to 120 characters; Code 39 accepts up to 80. QR codes accept Unicode, limited to 2,000 UTF-8 bytes for readable output.
- PNG exports contain an opaque white background and barcode quiet zones. The preview fits the screen; exports retain full resolution. Very long linear barcodes are best shared or saved at full size.
- Image copy appears only on browsers that expose PNG clipboard support. Share / save uses the native share sheet when file sharing is supported; otherwise it downloads a PNG. Clipboard and share restrictions produce a helpful fallback message.
- Follows the device's light/dark appearance and reduced-motion preference. Includes keyboard navigation, visible focus, form labels, and accessible result/error messages.

## Offline and mobile installation

Camera access requires HTTPS (or localhost) and browser permission. GitHub Pages provides HTTPS. A normal HTTP LAN address is insufficient for phone camera tests.

The production service worker precaches the app and all barcode libraries after the first successful visit. Open Add to home screen and wait for “Ready for offline use” before relying on offline startup. Nothing about scanned/created contents is cached. Offline support depends on the browser retaining the cache; private browsing or storage cleanup may remove it. Updates take effect after all existing app tabs are closed and the app is reopened.

On iOS/iPadOS, open in Safari, then Share → Add to Home Screen. On Android, use the browser's Install app / Add to Home screen option. No native installation, signing, or Apple developer team is needed.

Designed for current Safari, Chrome, Edge, and Firefox on phones, tablets, and desktops. Live camera behavior and OS share sheets require physical-device testing; desktop mobile viewport checks are not substitutes for testing on an iPhone XS and iPhone 16.

## GitHub Pages publishing

The local source is this folder. The deployment checkout is kept separately at `.local/pages/` (ignored by Git). In the Pages repository, built output goes into `barcode-tools/`, and reproducible source goes into `_barcode-tools/`. The underscore keeps source out of the repository's existing Jekyll Pages output. Existing site files are retained; the homepage gains a link to Barcode Tools.

Run tests and build, then prepare a clean checkout:

```sh
npm test
npm run build
node scripts/prepare-pages.mjs /absolute/path/to/pages-checkout
```

Review the checkout diff, commit only the prepared Barcode Tools files and homepage link, and push to the existing Pages branch. `scripts/prepare-pages.mjs` does not commit or push. Publishing credentials must belong to `craigvillacorta` or have write access to that repository. Use a separate GitHub CLI config and a repository-local Git credential helper; do not change ScreenHugs' global account settings.

## Verification

`npm test` generates real barcode images and decodes their pixels with ZXing, checking all three formats, Unicode QR, ASCII controls, whitespace preservation, literal HTML text, invalid values, maximum lengths, and opaque quiet zones.

Manual browser checks cover narrow/mobile and desktop layouts, all create formats, validation, PNG image copy, scan startup/cancellation, and installation help. Chrome successfully reloads and creates a new QR code after the local server is stopped. Hardware acceptance: scan each format with Safari on the iPhone XS and iPhone 16; confirm camera release after success and tab/background changes; test Copy, Share / Save Image, and a home-screen launch in airplane mode after initial caching.

Third-party license notices are bundled in `public/THIRD-PARTY-LICENSES.txt` and included in the deployment.
