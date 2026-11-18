# Torque-rex frontend

React and TypeScript application built with Vite for the Torque-rex motor test suite. The current UI is a minimal workspace with configurable styles and light/dark/system appearance; a measurement dashboard is planned. See the [project overview](../README.md) and [firmware guide](../firmware/README.md).

## Prerequisites and installation

Install Node.js and npm. The locked Vite, React plugin, and Oxlint packages declare Node.js `^20.19.0 || >=22.12.0`; use a Node version satisfying that range. No project-specific Node version file is provided.

From the repository root:

```sh
cd frontend
npm ci
```

`npm ci` installs dependencies from `package-lock.json`. The stack includes React 19, TypeScript 7, Vite 8, and `@vitejs/plugin-react`. The React Compiler is not enabled.

## Local development

Run from `frontend/`:

```sh
npm run dev
```

Open the local URL printed by Vite. Edit `src/App.tsx` and styles in `src/` to use hot module replacement. Files in `public/` are copied into the production output unchanged. The development server runs on your computer; it does not upload anything to the ESP32.

Additional commands, also from `frontend/`:

```sh
npm run lint
npm run build
npm run preview
```

Linting uses Oxlint with the existing React, TypeScript, and Oxc rules in `.oxlintrc.json`. The build runs `tsc -b && vite build` to check TypeScript and produce static files in `dist/`. Preview serves that production output locally using Vite; it is not ESP32 deployment. `dist/` is generated and ignored by Git, and may be absent until a build is run.

## Themes and styling

The frontend uses plain CSS and React without an additional styling framework.

- `src/styles/tokens.css`: central settings for body, heading, and monospace fonts, type sizes, spacing, corners, motion, and semantic colors for each theme.
- `src/styles/base.css`: reset, typography defaults, keyboard focus, and reduced-motion support.
- `src/theme/config.ts`: default appearance (`system`) and the local-storage key.
- `src/theme/ThemeProvider.tsx`: resolves system appearance, follows OS changes, persists explicit choices when storage is available, and exposes `useTheme()`.
- `src/components/ui/`: shared components such as `Button`, with primary and secondary variants and native button props.
- `src/App.css`: workspace layout only.

To restyle the whole app, edit tokens rather than individual components. For example, change `--font-body` for UI text, `--font-heading` for headings, or `--color-accent` in both light and dark palettes. Components should reference semantic variables such as `var(--color-surface)` instead of hardcoded colors. New controls can use `useTheme()` for `preference`, `resolvedTheme`, and `setPreference()`.

For a custom font, place licensed `.woff2` files in `src/assets/fonts/`, declare `@font-face` in `base.css` with a relative URL and `font-display: swap`, then reference the family in the font tokens. Bundle fonts locally so the ESP32-hosted UI stays usable offline; include font size in the filesystem budget.

## Deploy to the ESP32

Firmware must already be uploaded over USB as described in the [firmware guide](../firmware/README.md#upload-firmware-over-usb). Frontend deployment is manual:

1. Run `npm run build` inside `frontend/`.
2. Copy **the contents** of `frontend/dist/` into `firmware/data/`, including `index.html` and `assets/`. Replace the previous frontend files so stale hashed assets do not accumulate; preserve any intentional unrelated files. Do not copy the containing `dist/` folder.
3. Open `firmware/` in PlatformIO and run **Upload Filesystem Image** for `esp32-s3`. This packages `data/` as LittleFS and writes it to the board over USB.
4. Connect to the ESP32 Wi-Fi network `Torque-rex` using password `TorqueRex2026`.
5. Open `http://192.168.4.1` in a browser. Stay connected if your device warns that the Wi-Fi network has no internet.

For a POSIX shell, the build and copy commands below run from `frontend/` (the copy overwrites matching files but does not remove old assets):

```sh
npm run build
mkdir -p ../firmware/data
cp -R dist/. ../firmware/data/
```

Then, from `firmware/`, with the PlatformIO Core CLI available:

```sh
pio run -e esp32-s3 -t uploadfs
```

The filesystem partition is `0x3F0000` bytes (4032 KiB), including filesystem overhead. Keep the complete deployed bundle within that capacity. Rebuild, copy, and upload the filesystem after frontend changes; uploading firmware alone does not update the UI.

During standalone operation the ESP32 serves these static files from LittleFS, and the user's browser executes React. Node.js, npm, Vite, a separate application server, an external router, and internet access are not required to use the deployed app. The UI uses system font stacks and has no external font, stylesheet, or image requests.

## Future firmware communication

The current frontend does not fetch sensor data or open WebSockets, and the firmware has no functional sensor-data API or WebSocket interface. Sensor acquisition, motor control, live measurements, and test automation remain planned.

A future UI will need a defined firmware communication interface for measurements and controls. Relative HTTP API requests could use the ESP32 origin when deployed; WebSockets are another possible future transport. Endpoints, payload schemas, update rates, and transport selection are not yet implemented. The Vite configuration currently has no backend proxy, so local development against future firmware endpoints will also need an explicit connection strategy.
