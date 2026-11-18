#pragma once
#include <stdint.h>
#include <math.h>

// Signed shortest-path deltas avoid counting stationary jitter as rotation.
class RpmEstimator {
public:
    void reset() { initialized = false; available = false; rpm = 0; }
    bool update(uint16_t angle, uint32_t now) {
        if (!initialized) {
            initialized = true;
            previous = angle;
            last = start = now;
            counts = 0;
            return true;
        }
        const uint32_t gap = now - last;
        if (gap == 0 || gap > 5000) { reset(); return false; }
        int delta = int(angle) - int(previous);
        if (delta > 2048) delta -= 4096;
        if (delta < -2048) delta += 4096;
        counts += delta;
        previous = angle;
        last = now;
        const uint32_t elapsed = now - start;
        if (elapsed >= 100000) {
            rpm = fabs(double(counts)) * 60000000.0 / (4096.0 * elapsed);
            available = true;
            counts = 0;
            start = now;
        }
        return true;
    }
    bool available = false;
    double rpm = 0;
private:
    bool initialized = false;
    uint16_t previous = 0;
    uint32_t last = 0, start = 0;
    int32_t counts = 0;
};
