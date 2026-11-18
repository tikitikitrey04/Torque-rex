#include "RpmEstimator.h"
#include <assert.h>
#include <stdint.h>
#include <initializer_list>

int main() {
    for (int direction : {1, -1}) {
        RpmEstimator estimator;
        for (uint32_t i = 0; i <= 100; ++i) {
            const uint16_t angle = (4000 + direction * int(i) * 64) & 4095;
            assert(estimator.update(angle, i * 1000));
        }
        assert(estimator.available);
        assert(fabs(estimator.rpm - 937.5) < 0.001);
        assert(!estimator.update(0, 110000));
        assert(!estimator.available);
    }
    RpmEstimator stationary;
    for (uint32_t i = 0; i <= 100; ++i)
        assert(stationary.update(100 + i % 2, i * 1000));
    assert(stationary.rpm == 0);
    RpmEstimator rollover;
    for (uint32_t i = 0; i <= 100; ++i)
        assert(rollover.update((i * 64) & 4095, UINT32_MAX - 50000 + i * 1000));
    assert(fabs(rollover.rpm - 937.5) < 0.001);
    rollover.reset();
    assert(!rollover.available && rollover.rpm == 0);
}
