
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <LittleFS.h>
#include "SerialLog.h"

// Wi-Fi configuration
const char* ssid = "Torque-rex";
const char* password = "TorqueRex2026";

// HTTP server
WebServer server(80);
SerialLog Console;

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

    if (!path.startsWith("/api/")) {
        Console.print("HTTP request: ");
        Console.println(path);
    }

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

    Console.println();
    Console.println("=== Torque-rex Motor Test Suite ===");

    // Initialize LittleFS
    Console.println("Mounting LittleFS...");

    if (!LittleFS.begin(false)) {
        Console.println("ERROR: LittleFS mount failed!");
        return;
    }

    Console.println("LittleFS mounted successfully!");

    Console.printf("Filesystem total: %lu bytes\n",
                  (unsigned long)LittleFS.totalBytes());

    Console.printf("Filesystem used: %lu bytes\n",
                  (unsigned long)LittleFS.usedBytes());

    // Start Wi-Fi access point
    WiFi.mode(WIFI_AP);

    if (!WiFi.softAP(ssid, password)) {
        Console.println("ERROR: Wi-Fi AP failed!");
        return;
    }

    Console.println("Wi-Fi started!");
    Console.print("SSID: ");
    Console.println(ssid);

    Console.print("IP Address: ");
    Console.println(WiFi.softAPIP());

    // Register web routes
    server.on("/api/serial", HTTP_GET, []() {
        server.sendHeader("Cache-Control", "no-store");
        server.send(200, "text/plain; charset=utf-8", Console.snapshot());
    });
    server.onNotFound(handleWebRequest);

    // Start HTTP server
    server.begin();

    Console.println("HTTP server started!");
    Console.println("Torque-rex ready!");
}

void loop() {
    server.handleClient();
    delay(1);
}
