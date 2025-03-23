from machine import Pin, I2S
import json
import time
import urequests
import ubinascii
import gc  # 导入垃圾回收模块

from microdot.microdot import Microdot, send_file, Response
from microdot.websocket import with_websocket
from microdot.cors import CORS
from common.connect_wifi import do_connect

# 初始化引脚
light2 = Pin(2, Pin.OUT)
btn32 = Pin(32, Pin.IN, Pin.PULL_DOWN)
status = 0
url = "http://192.168.43.7:3000"

# 全局变量，用于存储 I2S 实例
# 喇叭
audio_out = None
# 麦克风
audio_in = None

# 初始化 I2S 
def init_audio_out():
    global audio_out
    audio_out = I2S(
        0, 
        sck=Pin(12), 
        ws=Pin(14), 
        sd=Pin(13), 
        mode=I2S.TX,  # 发送模式
        bits=16,      # 16 位 PCM
        format=I2S.MONO,  # 单声道
        rate=16000,   # 采样率 16kHz
        ibuf=4096     # 减小缓冲区大小
    )

def init_audio_in():
    global audio_in
    audio_in = I2S(1, 
        sck=Pin(26), 
        ws=Pin(27), 
        sd=Pin(25), 
        mode=I2S.RX,  # 接收模式
        bits=16,      # 每个样本16位
        format=I2S.MONO,  # 单声道
        rate=8000,   # 采样率 16kHz
        ibuf=4096     # 减小缓冲区大小
    )

# 去抖动函数
def debounce():
    time.sleep_ms(100)  # 延时50毫秒，防止按钮抖动

# 中断回调函数
def btn_irq(btn):
    global status
    global url
    global audio_out, audio_in

    debounce()  # 去抖动，避免按钮的抖动导致误触发
    # 按钮按下时反转状态
    if btn.value() == 1:  # 按钮按下
        status = 1 - status  # 切换状态，1变0，0变1
        print(status)  # 打印当前状态
        light2.value(status)  # 根据状态控制LED
        if status == 1:
            print("开始工作")
            # 初始化 I2S
            init_audio_out()
            init_audio_in()
            urequests.get(f"{url}/record")  # 确保关闭连接
        else:
            print("结束工作")
            # 释放 I2S 资源
            if audio_out:
                audio_out.deinit()
                audio_out = None
            if audio_in:
                audio_in.deinit()
                audio_in = None
            gc.collect()  # 手动触发垃圾回收

# 设置按钮的中断，检测上升沿（按钮按下）
btn32.irq(trigger=Pin.IRQ_RISING, handler=btn_irq)

ssid = "redrun"
password = "0123456789"
do_connect(ssid, password)

app = Microdot()
port = 5000

# CORS 设置
CORS(app, allowed_origins='*', allow_credentials=True,
     allowed_methods=['GET', 'POST', 'OPTIONS'], expose_headers=None,
     allowed_headers='*', max_age='86400', handle_cors=True)

@app.route('/media', methods=['GET'])
async def play(request):
    return send_file("./public/audio.pcm")

@app.route('/new_chat', methods=['GET'])
async def new_chat(request):
    init_audio_out()
    init_audio_in()
    urequests.get(f"{url}/record")  # 确保关闭连接
    return "ok"

@app.route('/buffer')
@with_websocket
async def buffer(request, ws):
    global audio_out
    try:
        while True:
            data = await ws.receive()
            if audio_out:  # 检查 audio_out 是否已初始化
                audio_out.write(data)
            gc.collect()  # 手动触发垃圾回收
    except Exception as e:
        print("WebSocket error1:", e)
    finally:
        if audio_out:
            audio_out.deinit()  # 释放音频资源
            audio_out = None
        

@app.route('/send_buffer')
@with_websocket
async def send_buffer(request, ws):
    global audio_in
    try:
        while True:
            res = await ws.receive()
            if res == 'pending':
                if audio_in:  # 检查 audio_in 是否已初始化
                    buffer = bytearray(1280)  # 减小缓冲区大小
                    audio_in.readinto(buffer)  # 从 I2S 读取音频数据
                    await ws.send(buffer)
                    gc.collect()  # 手动触发垃圾回收
            elif res =='ended':
                print('close audio_in')
                audio_in.deinit()
            gc.collect()  # 手动触发垃圾回收
    except Exception as e:
        print("WebSocket error2:", e)
    finally:
        if audio_in:
            audio_in.deinit()  # 释放音频资源
            audio_in = None
       



# 运行应用程序
print("running 5000")
app.run(host='0.0.0.0', port=port, debug=False, ssl=None)

