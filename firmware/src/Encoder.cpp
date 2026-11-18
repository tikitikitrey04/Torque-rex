#include <Arduino.h>
#include <Wire.h>
#include <WebServer.h>
#include <esp_timer.h>
#include "Encoder.h"
#include "RpmEstimator.h"

extern WebServer server;
namespace {
constexpr int SDA_PIN = 8;
constexpr int SCL_PIN = 9;
constexpr uint8_t ADDRESS = 0x36;
enum Health { Starting, Healthy, BusError, MagnetError, TimingError };
portMUX_TYPE mutex = portMUX_INITIALIZER_UNLOCKED;
struct Snapshot { Health health; double rpm; int64_t updated; } snapshot{Starting, 0, 0};
String session;

void sampleEncoder(void*) {
    RpmEstimator estimator;
    for (;;) {
        // Read STATUS and both RAW ANGLE bytes in one contiguous transaction.
        Wire.beginTransmission(ADDRESS);
        Wire.write(0x0B);
        Health health = Healthy;
        uint16_t angle = 0;
        if (Wire.endTransmission(false) != 0 ||
            Wire.requestFrom(ADDRESS, uint8_t(3)) != 3) {
            health = BusError;
        } else {
            const uint8_t status = Wire.read();
            const uint8_t high = Wire.read();
            const uint8_t low = Wire.read();
            angle = (uint16_t(high & 0x0F) << 8) | low;
            if (!(status & 0x20) || (status & 0x18)) health = MagnetError;
        }
        if (health != Healthy) estimator.reset();
        else if (!estimator.update(angle, micros())) health = TimingError;
        else if (!estimator.available) health = Starting;
        portENTER_CRITICAL(&mutex);
        snapshot = {health, estimator.rpm, esp_timer_get_time()};
        portEXIT_CRITICAL(&mutex);
        vTaskDelay(1);
    }
}
}

void startEncoder() {
    session = "encoder-" + String(esp_random(), HEX) + String(esp_random(), HEX);
    Wire.begin(SDA_PIN, SCL_PIN, 400000);
    Wire.setTimeOut(10);
    if (xTaskCreatePinnedToCore(sampleEncoder, "as5600", 4096, nullptr, 2, nullptr, 1) != pdPASS) {
        portENTER_CRITICAL(&mutex);
        snapshot.health = BusError;
        portEXIT_CRITICAL(&mutex);
        Serial.println("ERROR: Could not start AS5600 sampling task");
    }
}

void handleTelemetry() {
    portENTER_CRITICAL(&mutex);
    const Snapshot current = snapshot;
    portEXIT_CRITICAL(&mutex);
    Health health = current.health;
    const int64_t now = esp_timer_get_time();
    if (now - current.updated > 250000) health = TimingError;
    const char* status = health == Healthy ? "running" : health == Starting ? "ready" : "error";
    const char* message = health == Healthy ? "Live encoder measurements" :
        health == Starting ? "Waiting for the first RPM window" :
        health == BusError ? "AS5600 not responding; check power and I2C wiring" :
        health == MagnetError ? "AS5600 magnet missing, too weak, or too strong" :
        "Encoder sampling delayed; RPM unavailable";
    char body[384];
    snprintf(body, sizeof(body),
        "{\"testId\":\"%s\",\"status\":\"%s\",\"elapsedMs\":%llu,\"rpm\":%.3f,\"message\":\"%s\"}",
        session.c_str(), status, (unsigned long long)(now / 1000),
        health == Healthy ? current.rpm : 0.0, message);
    server.sendHeader("Cache-Control", "no-store");
    server.send(200, "application/json", body);
}
