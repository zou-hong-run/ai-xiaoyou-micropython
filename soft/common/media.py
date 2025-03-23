from machine import Pin, I2S
import array
import time
import urequests
import os
import ubinascii
import uwebsockets.client
# 发送设备信息
# uname = os.uname()
# device_info = '{sysname} {release} {version} {machine}'.format(
#     sysname=uname.sysname,
#     release=uname.release,
#     version=uname.version,
#     machine=uname.machine,
# )
# websocket.send(device_info)
# print(f"> Sent device info: {device_info}")

def record_and_send_audio(url):
    isEnded = False
    # I2S 配置
    sck_pin = Pin(26)  # Bit clock
    ws_pin = Pin(27)   # Word select
    sd_pin = Pin(25)   # Data line

    i2s = I2S(1, 
        sck=sck_pin, 
        ws=ws_pin, 
        sd=sd_pin, 
        mode=I2S.RX,  # 接收模式
        bits=16,      # 每个样本16位
        format=I2S.MONO,  # 单声道
        rate=16000,   # 采样率 16kHz
        ibuf=4096     # 缓冲区大小
    )
    # WebSocket 连接
    with uwebsockets.client.connect(url) as websocket:
        print("Connected to WebSocket server")
        res = websocket.recv()
        if res == 'ok':
            print(res)
            # 发送音频数据
            while not isEnded:  # 发送 30 个音频数据块
#                 print(isEnded, "isEnded")
                buffer = bytearray(1280)  # 每个数据块 1280 字节
                i2s.readinto(buffer)  # 从 I2S 读取音频数据
                audio_base64 = ubinascii.b2a_base64(buffer).decode('utf-8').strip()
                # 补全 Base64 字符串长度
#                 padding = len(audio_base64) % 4
#                 if padding > 0:
#                     audio_base64 += '=' * (4 - padding)
                websocket.send(audio_base64)  # 发送音频数据
                time.sleep_ms(40)

                # 监听 WebSocket 是否收到 'end' 消息
                res = websocket.recv()  # 读取 WebSocket 返回的数据
                if res == 'end':
                    isEnded = True
                    i2s.deinit()  # 停止 I2S
                    print(res)
                

        else:
            print("Failed to connect or invalid response.")
            
            
def file_or_dir_exists(filename):
    try:
        os.stat(filename)
        return True
    except OSError:
        return False
def record_to_iat_buffer(url,callback):
    # I2S配置参数
    sck_pin = Pin(26)  # Bit clock
    ws_pin = Pin(27)   # Word select
    sd_pin = Pin(25)   # Data line

    i2s = I2S(1, 
        sck=sck_pin, 
        ws=ws_pin, 
        sd=sd_pin, 
        mode=I2S.RX,  # 接收模式
        bits=16,      # 每个样本16位
        format=I2S.MONO,  # 单声道
        rate=16000,   # 采样率 16kHz
        ibuf=4096    # 缓冲区大小
    )
    audio_url = f"{url}/audio-stream"  # Express 服务器地址
    count=0
    while count<30:
        count = count + 1
        buffer = bytearray(1280)
        i2s.readinto(buffer)
        try:
            headers = {'Content-Type': 'application/octet-stream'}
            response = urequests.post(audio_url, data=buffer,headers=headers)
            text = str(response.text)
            callback(text)  # 处理服务器返回的识别结果
            if text == "closed":
                return False
        except Exception as e:
            print("Error:", e)
            return False

    print("Recording stopped.")
def record_to_iat_base_64(url,callback):
    # I2S配置参数
    sck_pin = Pin(26)  # Bit clock
    ws_pin = Pin(27)   # Word select
    sd_pin = Pin(25)   # Data line

    i2s = I2S(1, 
        sck=sck_pin, 
        ws=ws_pin, 
        sd=sd_pin, 
        mode=I2S.RX,  # 接收模式
        bits=16,      # 每个样本16位
        format=I2S.MONO,  # 单声道
        rate=16000,   # 采样率 16kHz
        ibuf=4096    # 缓冲区大小
    )
    audio_url = f"{url}/audio-stream"  # Express 服务器地址
    control_url = f"{url}/control?command=stop"  # 控制接口地址
    count=0
    while count<30:
        count = count + 1
        buffer = bytearray(1280)
        i2s.readinto(buffer)
        try:
            # 将二进制数据转换为 Base64
            audio_base64 = ubinascii.b2a_base64(buffer).decode('utf-8').strip()
            # 构造 JSON 数据
            frame_data = {
                "audio": audio_base64,  # Base64 编码的音频数据=
            }
            # 发送 JSON 数据
            response = urequests.post(audio_url, json=frame_data, headers=headers)
    #             callback(text)  # 处理服务器返回的识别结果
    #             if text == "closed":
    #                 return False
        except Exception as e:
            print("Error:", e)
            return False
#         time.sleep_ms(40)  # 间隔 40ms
        # 检查是否需要终止
#         control_response = urequests.get(control_url)
#         if control_response.text == 'Recording stopped.':
#             print("Stopping recording...")
#             break

    print("Recording stopped.")
def record(record_duration=5):
    # I2S配置参数
    sck_pin = Pin(26)  # Bit clock
    ws_pin = Pin(27)   # Word select
    sd_pin = Pin(25)   # Data line

    i2s = I2S(1, 
        sck=sck_pin, 
        ws=ws_pin, 
        sd=sd_pin, 
        mode=I2S.RX,  # 接收模式
        bits=16,      # 每个样本16位
        format=I2S.MONO,  # 单声道
        rate=16000,   # 采样率 16kHz
        ibuf=4096    # 缓冲区大小
    )

    # 定义录音持续时间（秒）
#     record_duration = 10  # 录制10秒

    # 定义保存文件的路径
    file_path = "./public/audio.pcm"
    # 如果文件已存在，则删除它
    
    if file_or_dir_exists(file_path):
        os.remove(file_path)
        print(f"Old audio file deleted: {file_path}")
    
    # 打开文件以写入二进制数据
    with open(file_path, "wb") as f:
        start_time = time.time()  # 记录开始时间
        while time.time() - start_time < record_duration:
            # 读取音频数据到缓冲区
            buffer = bytearray(2048)
            i2s.readinto(buffer)
            
            # 将音频数据写入文件
            f.write(buffer)
            
            # 打印进度（可选）
            elapsed_time = time.time() - start_time
            print(f"Recording... {elapsed_time:.2f} seconds")

    print(f"Recording finished. Audio saved to {file_path}")


def play():
    """
    GPIO13 -- DIN
    GPIO12 --- BCLK
    GPIO14 -- LRC
    GND -- GND
    5V或3.3V -- VCC
    """
     
    # 初始化引脚定义
    sck_pin = Pin(12) # 串行时钟输出
    ws_pin = Pin(14)  # 字时钟
    sd_pin = Pin(13)  # 串行数据输出
     
     

    """
    sck 是串行时钟线的引脚对象
    ws 是单词选择行的引脚对象
    sd 是串行数据线的引脚对象
    mode 指定接收或发送
    bits 指定样本大小（位），16 或 32
    format 指定通道格式，STEREO（左右声道） 或 MONO(单声道)
    rate 指定音频采样率（样本/秒）
    ibuf 指定内部缓冲区长度（字节）
    """
     
    # 初始化i2s
    audio_out = I2S(0, sck=sck_pin, ws=ws_pin, sd=sd_pin, mode=I2S.TX, bits=16, format=I2S.MONO, rate=16000, ibuf=2048)
     
     
    wavtempfile = "./public/audio.pcm"
    with open(wavtempfile,'rb') as f:
     
        # 跳过文件的开头的44个字节，直到数据段的第1个字节
        pos = f.seek(0) 
     
        # 用于减少while循环中堆分配的内存视图
        wav_samples = bytearray(2048)
        wav_samples_mv = memoryview(wav_samples)
         
        print("开始播放音频...")
        
        #并将其写入I2S DAC
        while True:
            try:
                num_read = f.readinto(wav_samples_mv)
                
                # WAV文件结束
                if num_read == 0: 
                    break
     
                # 直到所有样本都写入I2S外围设备
                num_written = 0
                while num_written < num_read:
                    num_written += audio_out.write(wav_samples_mv[num_written:num_read])
                    
            except Exception as ret:
                print("产生异常...", ret)
                break
def online(url,callback=None):
    # 初始化引脚定义
    sck_pin = Pin(12)  # 串行时钟输出
    ws_pin = Pin(14)   # 字时钟
    sd_pin = Pin(13)   # 串行数据输出

    # 初始化 I2S
    audio_out = I2S(
        0, 
        sck=sck_pin, 
        ws=ws_pin, 
        sd=sd_pin, 
        mode=I2S.TX,  # 发送模式
        bits=16,      # 16 位 PCM
        format=I2S.MONO,  # 单声道
        rate=16000,   # 采样率 16kHz
        ibuf=2048     # 缓冲区大小
    )

    # 获取音频数据
    # 注意：确保 URL 是 HTTP，而不是 HTTPS
    response = urequests.get(url, stream=True)

    # 如果是 WAV 文件，跳过 44 字节的文件头
    # 如果是纯 PCM 数据，则不需要跳过
    # response.raw.read(44)  # 如果需要跳过文件头，取消注释此行

    print("开始播放音频...")

    # 播放音频数据
    while True:
        try:
            content_byte = response.raw.read(2048)  # 每次读取 2048 个字节
            
            # 判断音频数据是否结束
            if len(content_byte) == 0:
                print("音频播放完毕")
                break

            # 调用 I2S 对象播放音频
            audio_out.write(content_byte)
            
        except Exception as ret:
            print("程序产生异常...", ret)
            callback and callback(False,"程序产生异常...")
            break

    # 释放 I2S 资源
    audio_out.deinit()
    print("播放结束")
    callback and callback(True,"播放结束")
if __name__ == "__main__":
    record()
    play()
#     url = "http://192.168.43.7:3000"
#     online(f"{url}/tetetet.pcm")
