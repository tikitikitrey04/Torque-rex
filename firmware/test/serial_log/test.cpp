#include <cassert>
#include "SerialLog.h"

SerialDouble Serial;

int main() {
    SerialLog log;
    assert(log.snapshot().empty());
    std::string expected;
    for (size_t i = 0; i < 20000; ++i) {
        const char value = static_cast<char>('a' + i % 26);
        assert(log.write(static_cast<uint8_t>(value)) == 1);
        expected += value;
    }
    assert(Serial.output == expected);
    assert(log.snapshot() == expected.substr(expected.size() - 16384));
    assert(log.snapshot() == log.snapshot()); // Reading does not consume logs.
    SerialLog rebooted;
    assert(rebooted.snapshot().empty());
}
