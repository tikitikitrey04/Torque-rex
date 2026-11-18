# Torque-rex firmware

Arduino firmware for the ESP32-S3-N16R8: 16 MB flash and 8 MB octal PSRAM. It mounts LittleFS, creates a Wi-Fi access point, and serves the compiled React application. See the [project overview](../README.md) and [frontend guide](../frontend/README.md).

## Setup and configuration

Install VS Code and the PlatformIO IDE extension. Open this `firmware/` directory as the PlatformIO project and let PlatformIO install the platform and Arduino toolchain. Connect the board with a USB data cable.

[platformio.ini](platformio.ini) defines environment `esp32-s3`:

| Setting | Value |
| --- | --- |
| Platform | `espressif32` (not version-pinned) |
| Board | `esp32-s3-devkitc-1` |
| Framework | `arduino` |
| Flash size | `board_upload.flash_size = 16MB` |
| Upload maximum | `board_upload.maximum_size = 16777216` |
| Flash mode | `board_build.flash_mode = qio` |
| Memory type | `board_build.arduino.memory_type = qio_opi` |
| PSRAM flag | `-DBOARD_HAS_PSRAM` |
| Partition table | `board_build.partitions = partitions.csv` |
| Filesystem | `board_build.filesystem = littlefs` |
| Serial Monitor | `monitor_speed = 115200` |

The upload maximum is a configuration value; each application slot is only 6 MiB. The current source does not print flash or PSRAM detection results, although successful detection was reported during hardware testing.

## Flash layout and LittleFS

[partitions.csv](partitions.csv) assigns these regions within the 16 MiB flash:

| Name | Type / subtype | Offset | Size | Capacity |
| --- | --- | --- | --- | --- |
| `nvs` | `data / nvs` | `0x9000` | `0x5000` | 20 KiB |
| `otadata` | `data / ota` | `0xE000` | `0x2000` | 8 KiB |
| `app0` | `app / ota_0` | `0x10000` | `0x600000` | 6 MiB |
| `app1` | `app / ota_1` | `0x610000` | `0x600000` | 6 MiB |
| `spiffs` | `data / spiffs` | `0xC10000` | `0x3F0000` | 4,128,768 bytes (4032 KiB) |

Despite the partition name and subtype `spiffs`, PlatformIO builds a **LittleFS** image and the firmware uses `LittleFS`. The table reserves OTA metadata and two application slots, but no OTA update service is implemented.

PlatformIO packages the contents of `data/` into the filesystem root: `data/index.html` becomes `/index.html`, and `data/assets/` becomes `/assets/`. Keep the complete production build within the filesystem partition capacity, allowing room for filesystem overhead. Do not put a containing `dist/` directory inside `data/`.

## Upload firmware over USB

In PlatformIO's Project Tasks, select `esp32-s3` → **General → Upload**. To build without uploading, use **Build**.

Alternatively, with the PlatformIO Core CLI available in your terminal, run from `firmware/`:

```sh
pio run -e esp32-s3
pio run -e esp32-s3 -t upload
```

Firmware upload writes the compiled embedded program. It does not deploy the frontend files in `data/`.

## Upload the frontend filesystem

First follow the [frontend build and copy procedure](../frontend/README.md#deploy-to-the-esp32). Then select `esp32-s3` → **Platform → Upload Filesystem Image** in PlatformIO.

CLI equivalent, from `firmware/`:

```sh
pio run -e esp32-s3 -t uploadfs
```

This builds and uploads the LittleFS image from `data/`, replacing the filesystem contents. It does not upload a new firmware program. Upload both firmware and filesystem on initial setup; frontend-only changes require a new frontend build, copy, and filesystem upload. Partition-table changes require uploading firmware and rebuilding/uploading the filesystem to match.

## Standalone access and HTTP behavior

[src/main.cpp](src/main.cpp) sets:

- Wi-Fi mode: `WIFI_AP`, with SSID `Torque-rex` and password `TorqueRex2026`.
- HTTP server: port `80`.
- Access address: `http://192.168.4.1` in the tested default AP configuration. The source prints `WiFi.softAPIP()` rather than setting an explicit IP.

Connect a browser device to this Wi-Fi network and open the address directly. Accept the device's option to stay connected without internet if prompted.

The server maps `/` to `/index.html`, streams existing files with content types based on their extensions, and logs request paths to serial. Missing paths without a dot fall back to `/index.html` unless they start with `/api/`. Missing assets and unhandled `/api/` requests return HTTP 404. There are no functional sensor-data API endpoints or WebSocket handlers. React executes in the browser; the ESP32 serves static files.

## Serial Monitor and troubleshooting

Use PlatformIO's **Monitor** task, or run from `firmware/`:

```sh
pio device monitor -b 115200
```

Reset the board to view startup messages. The firmware reports LittleFS mount success/failure, filesystem total/used bytes, AP startup, IP address, and HTTP startup.

**USB port not detected or upload fails:** check that the cable supports data, reconnect the board, check the board's USB connector, and close other serial monitors. Run `pio device list` to find the current port. If automatic detection chooses incorrectly, use `pio run -e esp32-s3 -t upload --upload-port <PORT>` with your detected port substituted. If needed, follow the board's BOOT/RESET procedure to enter its USB download mode; connector and driver details depend on the physical board.

**LittleFS mount fails:** the source calls `LittleFS.begin(false)`, so it does not format automatically on failure. Startup returns before creating the AP or starting HTTP. Check that firmware and filesystem were built with this partition table and LittleFS setting, then rebuild/upload the filesystem. A changed layout or an uninitialized image can require uploading both firmware and filesystem again.

**Page or assets missing:** confirm `data/index.html` and all referenced assets exist, upload the filesystem image (not only firmware), reset the board, and inspect serial logs. Copying files on the computer alone does not change the ESP32's flash.

## Planned work

Sensor acquisition, motor control, live measurements, test automation, and browser/firmware data communication remain future work. Sensor wiring, control protocols, API schemas, and OTA deployment are not defined by the current implementation.

## Browser serial monitor (testMode)

`GET /api/serial` returns a noncached `text/plain` snapshot of the latest 16 KiB of application logs. `include/SerialLog.h` provides `Console`'s bounded ring buffer; use `Console.print`, `Console.println`, and `Console.printf` for messages that should go to both USB and the browser. Logging starts before Wi-Fi setup, so startup messages remain available after connection. API polls are not logged, preventing the monitor from filling its own buffer.

After uploading firmware and the updated frontend filesystem, connect to Torque-rex Wi-Fi and open `http://192.168.4.1/#/serial`. Device restarts clear the buffer. ROM/SDK diagnostics and direct `Serial` writes are outside this application log capture. The current buffer is used from the Arduino main loop; concurrent task or ISR logging would require synchronization.

Host buffer checks (from the repository root):

```sh
c++ -std=c++11 -I firmware/test/serial_log -I firmware/include firmware/test/serial_log/test.cpp -o /tmp/torque-rex-serial-log-test
/tmp/torque-rex-serial-log-test
```
