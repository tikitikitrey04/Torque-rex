#pragma once
// Minimal host doubles for testing the ring buffer without an ESP32.
#include <cstddef>
#include <cstdint>
#include <string>
using String = std::string;
class Print {
public:
    virtual ~Print() = default;
    virtual size_t write(uint8_t value) = 0;
};
struct SerialDouble {
    std::string output;
    size_t write(uint8_t value) { output += static_cast<char>(value); return 1; }
};
extern SerialDouble Serial;
