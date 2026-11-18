# Torque-rex frontend

React and TypeScript application built with Vite for the Torque-rex motor test suite. The current UI is a single-page workspace with a top-level test-suite status and light/dark/system appearance; a measurement dashboard is planned. See the [project overview](../README.md) and [firmware guide](../firmware/README.md).

## Prerequisites and installation

Install Node.js and npm. The locked Vite, React plugin, and Oxlint packages declare Node.js `^20.19.0 || >=22.12.0`; use a Node version satisfying that range. No project-specific Node version file is provided.

From the repository root:

```sh
cd frontend
npm install
```

Alternatively, use `npm ci` to install dependencies from `package-lock.json`. The stack includes React 19, TypeScript 7, Vite 8, and `@vitejs/plugin-react`. The React Compiler is not enabled.

## Local development

Run from `frontend/`:

```sh
npm run dev
```

Open the local URL printed by Vite. Edit `src/App.tsx` and styles in `src/` to use hot module replacement. Files in `public/` are copied into the production output unchanged. The development server runs on your computer; it does not upload anything to the ESP32.

Additional commands, also from `frontend/`:

```sh
npm run lint
npm run preview
```

Linting uses Oxlint with the existing React, TypeScript, and Oxc rules in `.oxlintrc.json`. Preview serves the production output locally using Vite; it is not ESP32 deployment.

## Production build

From `frontend/`:

```sh
npm run build
```

The build runs `tsc -b && vite build` to check TypeScript, then Vite generates production-ready HTML, CSS, JavaScript, and other assets in `frontend/dist/`. `dist/` is generated and ignored by Git, and may be absent until a build is run.

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

Torque-rex uses an ESP32-S3-N16R8 with 16 MB flash and 8 MB PSRAM. Firmware must already be uploaded over USB as described in the [firmware guide](../firmware/README.md#upload-firmware-over-usb).

From `frontend/`, build the dashboard and replace the deployed frontend files:

```bash
npm run build
rm -rf ../firmware/data/*
cp -R dist/. ../firmware/data/
```

Continue with the removal and copy only after the build succeeds. The removal deletes the previous contents of `firmware/data/`; keep any intentional unrelated files elsewhere before running it. Copy the contents of `dist/`, including `index.html` and `assets/`, rather than the containing folder.

PlatformIO packages the contents of `firmware/data/` into a LittleFS filesystem image and uploads it to the board over USB. In VS Code:

1. Open PlatformIO with the `firmware/` project selected.
2. Navigate to **Project Tasks → esp32-s3 → Platform**.
3. Select **Upload Filesystem Image**.
4. Confirm the upload finishes successfully.
5. Connect to the `Torque-rex` Wi-Fi network using password `TorqueRex2026`.
6. Visit `http://192.168.4.1`. Stay connected if your device warns that the Wi-Fi network has no internet.

Alternatively, from `firmware/`, with the PlatformIO Core CLI available:

```sh
pio run -e esp32-s3 -t uploadfs
```

The filesystem partition is `0x3F0000` bytes (4032 KiB), including filesystem overhead. Keep the complete deployed bundle within that capacity.

### Development versus deployment

| Action | Result |
| --- | --- |
| `npm run dev` (from `frontend/`) | Runs Vite's local development server with hot reload on the developer's computer. |
| `npm run build` (from `frontend/`) | Generates production files in `frontend/dist/`. |
| **Upload Filesystem Image** | Deploys the files staged in `firmware/data/` to the ESP32's LittleFS partition. |
| **Upload Firmware** | Updates the ESP32's C++ application. |

Filesystem upload is separate from firmware upload. React changes generally require rebuilding, copying, and uploading the filesystem image, without recompiling or reflashing the C++ firmware. Uploading firmware alone does not update the UI.

During standalone operation the ESP32 serves the compiled static files from LittleFS, and the user's browser executes React. No Node.js or Vite server runs on the ESP32. Node.js, npm, a separate application server, an external router, and internet access are not required to use the deployed app. The UI uses system font stacks and has no external font, stylesheet, or image requests.

### Troubleshooting stale frontend deployments

**Problem:** The React application builds successfully and updated files are present in `firmware/data/`, but the ESP32 continues serving an older website.

During development, this was resolved by removing the previously generated LittleFS image. This is a confirmed solution for that occurrence; other stale deployments can have different causes.

1. Close the PlatformIO Serial Monitor.
2. Open a terminal in `firmware/`.
3. Delete the generated LittleFS image:

   ```bash
   rm -f .pio/build/esp32-s3/littlefs.bin
   ```

4. Run **Upload Filesystem Image** again.
5. Verify the updated frontend at `http://192.168.4.1`.

Deleting `littlefs.bin` forces PlatformIO to regenerate the filesystem image from the current files in `firmware/data/` on the next filesystem upload.

Use these diagnostic checks to investigate other possible causes:

- Confirm `npm run build` completed successfully.
- From `frontend/`, compare the build output with the staged files:

  ```bash
  diff -qr dist ../firmware/data
  ```

  No output means the directories match.
- Verify PlatformIO targets the correct `firmware/` directory, especially in a VS Code multi-root workspace.
- Check the filesystem upload terminal output for the expected project path and successful completion.
- Rule out browser caching with a private browsing session or by clearing site data.

## Serial output page (testMode)

Open **Serial output** in the header (or `http://192.168.4.1/#/serial`) to read recent firmware application output over Wi-Fi. Light/dark appearance is shared with the test-suite page. Pause/resume stops or restarts polling; Follow output controls automatic scrolling. Output stays visible during a connection failure and reconnects automatically. Text is displayed literally, without HTML interpretation.

The page polls `GET /api/serial` every 500 ms with a 3-second timeout and no overlapping requests. The firmware returns a plain-text snapshot of its latest 16 KiB of application logs, including startup messages. Each response replaces the browser snapshot, so reconnects do not duplicate lines. The oldest bytes are overwritten when full; restarting the ESP32 clears the buffer. Pause freezes the browser view, while the device continues logging.

Upload the updated firmware **and** rebuild/copy/upload the frontend filesystem using the deployment steps above. Then connect the end user's device to the Torque-rex Wi-Fi and open the serial page. No USB connection or Web Serial permission is needed on that device. Local Vite development requires a `/api` proxy to the ESP32 or a mock endpoint.

Firmware output must use `Console.print()`, `Console.println()`, or `Console.printf()` to appear in both USB serial and the browser. Direct `Serial` writes, boot ROM messages, and third-party library diagnostics are not captured automatically. This page is a read-only log viewer; it does not send serial commands.

## Test-suite status

`src/components/SuiteStatus.tsx` accepts a typed `status` (`ready`, `running`, `completed`, `error`, or `disconnected`) and an optional descriptive `message`. Status uses both text and theme-aware color, and changes are announced to assistive technology. Status colors are configured in `tokens.css`.

`App.tsx` reads status and samples through `useTelemetry()`. Until a device telemetry endpoint is available, the header shows Disconnected and the chart waits for data.

## Future firmware communication

The frontend polls `GET /api/telemetry` every 250 ms with no overlapping requests, a 3-second timeout, and a 1-second retry after failure. **The firmware endpoint and RPM acquisition are not implemented yet.** Until they are, the UI shows Disconnected / Waiting for data. No measurements are simulated.

The expected JSON snapshot is:

```json
{
  "testId": "test-001",
  "status": "running",
  "elapsedMs": 1250,
  "rpm": 3200
}
```

- `testId`: nonempty unique identifier for each test; changing it clears the prior graph.
- `status`: `ready`, `running`, `completed`, or `error`.
- `elapsedMs`: finite, nonnegative milliseconds since test start; increase monotonically within a test.
- `rpm`: finite, nonnegative motor speed (zero is a valid reading).

The chart displays a rolling 60-second window with an automatically scaled RPM axis. It retains at most 1,200 samples, ignores duplicate/out-of-order timestamps, and preserves the final readings after completion or connection loss. Ready snapshots do not add points. Polling collects snapshots rather than every sensor sample; higher-rate acquisition will need a batched or streaming firmware interface.

Requests use the current origin for ESP32 deployment. For local development with hardware, configure a Vite `/api` proxy to the device or provide a local mock endpoint returning this contract. Neither is configured by default. Sensor acquisition, motor control, and test automation remain planned.

Run telemetry model checks with a Node version supporting TypeScript stripping:

```sh
node --experimental-strip-types --test tests/telemetry.test.mjs
```
