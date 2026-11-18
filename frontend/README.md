# Torque-rex frontend

React and TypeScript application built with Vite for the Torque-rex motor test suite. The current UI is the React/Vite starter screen with a counter; a measurement dashboard is planned. See the [project overview](../README.md) and [firmware guide](../firmware/README.md).

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

During standalone operation the ESP32 serves these static files from LittleFS, and the user's browser executes React. Node.js, npm, Vite, a separate application server, an external router, and internet access are not required to use the deployed app. External documentation/community links on the starter screen still require internet access.

## Future firmware communication

The current frontend does not fetch sensor data or open WebSockets, and the firmware has no functional sensor-data API or WebSocket interface. Sensor acquisition, motor control, live measurements, and test automation remain planned.

A future UI will need a defined firmware communication interface for measurements and controls. Relative HTTP API requests could use the ESP32 origin when deployed; WebSockets are another possible future transport. Endpoints, payload schemas, update rates, and transport selection are not yet implemented. The Vite configuration currently has no backend proxy, so local development against future firmware endpoints will also need an explicit connection strategy.
