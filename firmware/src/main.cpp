
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <LittleFS.h>
#include "Encoder.h"

// Wi-Fi configuration
const char* ssid = "Torque-rex";
const char* password = "TorqueRex2026";

// HTTP server
WebServer server(80);

// Determine the content type of requested files
String getContentType(const String& filename) {
    if (filename.endsWith(".html")) return "text/html";
    if (filename.endsWith(".css")) return "text/css";
    if (filename.endsWith(".js")) return "application/javascript";
    if (filename.endsWith(".json")) return "application/json";
    if (filename.endsWith(".svg")) return "image/svg+xml";
    if (filename.endsWith(".png")) return "image/png";
    if (filename.endsWith(".jpg") || filename.endsWith(".jpeg"))
        return "image/jpeg";
    if (filename.endsWith(".ico")) return "image/x-icon";
    if (filename.endsWith(".woff2")) return "font/woff2";
    if (filename.endsWith(".txt")) return "text/plain";

    return "application/octet-stream";
}

// Serve a file stored in LittleFS
bool serveFile(String path) {
    if (path == "/") {
        path = "/index.html";
    }

    if (!LittleFS.exists(path)) {
        return false;
    }

    File file = LittleFS.open(path, "r");

    if (!file || file.isDirectory()) {
        if (file) file.close();
        return false;
    }

    String contentType = getContentType(path);

    server.streamFile(file, contentType);
    file.close();

    return true;
}

// Handle browser requests
void handleWebRequest() {
    String path = server.uri();

    Serial.print("HTTP request: ");
    Serial.println(path);

    // First look for the requested file
    if (serveFile(path)) {
        return;
    }

    // Support React client-side routes.
    // Do not return HTML for missing assets or API requests.
    if (!path.startsWith("/api/") &&
        path.indexOf('.') == -1 &&
        serveFile("/index.html")) {
        return;
    }

    server.send(404, "text/plain", "404: File not found");
}

void setup() {
    Serial.begin(115200);
    delay(2000);

    Serial.println();
    Serial.println("=== Torque-rex Motor Test Suite ===");

    // Initialize LittleFS
    Serial.println("Mounting LittleFS...");

    if (!LittleFS.begin(false)) {
        Serial.println("ERROR: LittleFS mount failed!");
        return;
    }

    Serial.println("LittleFS mounted successfully!");

    Serial.printf("Filesystem total: %lu bytes\n",
                  (unsigned long)LittleFS.totalBytes());

    Serial.printf("Filesystem used: %lu bytes\n",
                  (unsigned long)LittleFS.usedBytes());

    // Start Wi-Fi access point
    WiFi.mode(WIFI_AP);

    if (!WiFi.softAP(ssid, password)) {
        Serial.println("ERROR: Wi-Fi AP failed!");
        return;
    }

    Serial.println("Wi-Fi started!");
    Serial.print("SSID: ");
    Serial.println(ssid);

    Serial.print("IP Address: ");
    Serial.println(WiFi.softAPIP());

    startEncoder();

    // Register web routes
    server.on("/api/telemetry", HTTP_GET, handleTelemetry);
    server.onNotFound(handleWebRequest);

    // Start HTTP server
    server.begin();

    Serial.println("HTTP server started!");
    Serial.println("Torque-rex ready!");
}

void loop() {
    server.handleClient();
    delay(1);
}
