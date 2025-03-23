from machine import Pin
import time
import network
import utime
# 初始化引脚
light2 = Pin(2, Pin.OUT)

def start_hotspot():
    # 创建热点
    ssid = 'redrun_esp32'
    password = '123456789'
    ap = network.WLAN(network.AP_IF)
    ap.active(True)
    ap.config(essid=ssid, password=password)
    while not ap.active():
        pass
    print(f"热点已经创建!")
    print(f'热点名称:{ssid},密码:{password}')
    print(f'连接热点后访问地址进行配网:{ap.ifconfig()[0]}:{port}')



def do_connect(ssid, password, max_retries=3, wait_time=5):
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    # 检查当前连接状态
    if wlan.isconnected():
        print(f"已连接到WiFi，网络配置:{wlan.ifconfig()[0]}:5000", )
        return True

    retries = 0

    while retries < max_retries:
        print(f"尝试连接第 {retries + 1} 次...")
        try:
            wlan.connect(ssid, password)
        except OSError as e:
            print(f"连接时发生错误: {e}")
            retries += 1
            time.sleep(wait_time)  # 等待一段时间再重试
            continue

        start_time = time.time()

        while not wlan.isconnected():
            light2.value(1)  # 开灯表示尝试连接
            time.sleep(0.5)
            light2.value(0)  # 关灯
            time.sleep(0.5)

            if time.time() - start_time > 15:
                print("WiFi连接超时！！！")
                break

        if wlan.isconnected():
            print("连接成功！！！！")
            print("网络配置:", wlan.ifconfig())
            return True

        print("连接失败，准备重试...")
        retries += 1
        time.sleep(wait_time)  # 等待一段时间再重试

    print("达到最大重试次数，连接失败！！！")
    light2.value(1)  # 最终保持灯亮
    return False

