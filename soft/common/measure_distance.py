from machine import Pin
import utime
# 超声波
# 引脚定义
TRIG_PIN = 14
ECHO_PIN = 12
# 引脚初始化
trig = Pin(TRIG_PIN, Pin.OUT)
echo = Pin(ECHO_PIN, Pin.IN)
# 定义测距函数
def measure_distance():
    trig.value(1)
    utime.sleep_us(10)
    trig.value(0)

    while echo.value() == 0:
        pass
    start = utime.ticks_us()

    while echo.value() == 1:
        pass
    end = utime.ticks_us()

    duration = utime.ticks_diff(end, start)
    distance = (duration * 0.0343) / 2
    return distance