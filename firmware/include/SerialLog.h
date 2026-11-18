#pragma once

#include <Arduino.h>

// Mirror application logs to USB and a bounded, in-memory browser log.
// Use Console.print/println/printf for output that should appear in both places.
class SerialLog : public Print {
public:
    using Print::write;

    size_t write(uint8_t value) override {
        Serial.write(value);
        buffer[head] = static_cast<char>(value);
        head = (head + 1) % Capacity;
        if (length < Capacity) ++length;
        return 1;
    }

    String snapshot() const {
        String result;
        result.reserve(length);
        const size_t start = (head + Capacity - length) % Capacity;
        for (size_t i = 0; i < length; ++i) {
            result += buffer[(start + i) % Capacity];
        }
        return result;
    }

private:
    static constexpr size_t Capacity = 16384;
    char buffer[Capacity] = {};
    size_t head = 0;
    size_t length = 0;
};
