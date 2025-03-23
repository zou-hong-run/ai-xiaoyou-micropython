/* Created by iflytek on 2020/03/01.
 *
 * 运行前：请先填写 appid、apiSecret、apiKey
 * 
 * 在线语音合成调用demo
 * 此demo只是一个简单的调用示例，不适合用到实际生产环境中
 *
 * 在线语音合成 WebAPI 接口调用示例 接口文档（必看）：https://www.xfyun.cn/doc/tts/online_tts/API.html
 * 错误码链接：
 * https://www.xfyun.cn/document/error-code （code返回错误码时必看）
 * 
 */
import CryptoJS from 'crypto-js'
import WebSocket from 'ws'
import fs from 'fs'
import { getUserType, apiKey, apiSecret, appid } from '../../config.js'

// 系统配置 
const config = {
    // 请求地址
    hostUrl: "wss://cbm01.cn-huabei-1.xf-yun.com/v1/private/mcd9m97e6",
    host: "cbm01.cn-huabei-1.xf-yun.com",
    //在控制台-我的应用-在线语音合成（流式版）获取
    appid,
    //在控制台-我的应用-在线语音合成（流式版）获取
    apiSecret,
    //在控制台-我的应用-在线语音合成（流式版）获取
    apiKey,
    text: "这是一个例子，请输入您要合成的文本",
    uri: "/v1/private/mcd9m97e6",
}

// 获取当前时间 RFC1123格式
let date = (new Date().toUTCString())
// 设置当前临时状态为初始化

let wssUrl = config.hostUrl + "?authorization=" + getAuthStr(date) + "&date=" + date + "&host=" + config.host

export const startTTS = (str, startCallback, dataCallback, endCallback) => {
    config.text = str;
    let ws = new WebSocket(wssUrl)

    // 连接建立完毕，读取数据进行识别
    ws.on('open', () => {
        console.info("websocket connect!")
        startCallback && startCallback()
        send(ws)
        // 如果之前保存过音频文件，删除之
        // if (fs.existsSync('./public/tts.pcm')) {
        //     fs.unlink('./public/tts.pcm', (err) => {
        //         if (err) {
        //             console.error('remove error: ' + err)
        //         }
        //     })
        // }
    })

    // 得到结果后进行处理，仅供参考，具体业务具体对待
    ws.on('message', (data, err) => {
        if (err) {
            console.error('message error: ' + err)
            return
        }
        let res = JSON.parse(data)
        let code = res.header.code;
        // console.log(res);
        if (res.payload) {
            let audio = res.payload.audio.audio
            let status = res.payload.audio.status
            let audioBuf = Buffer.from(audio, 'base64')

            if (status == 2) {
                console.log("tts结束");

                ws.close()
            }
            if (code != 0) {
                console.log(res.message)
            } else {
                // save(audioBuf)
                dataCallback && dataCallback(audioBuf)
            }
        }

        // if (res.code != 0) {
        //     console.error(`${res.code}: ${res.message}`)
        //     ws.close()
        //     return
        // }
        // if(res.payload){
        //     let audio = res.payload.audio.audio
        //     let status = res.payload.audio.status
        //     let audioBuf = Buffer.from(audio, 'base64')

        //     save(audioBuf)

        //     if (status == 2) {
        //         ws.close()
        //     }
        // }

    })

    // 资源释放
    ws.on('close', () => {
        console.info('tts close!')
        endCallback && endCallback()
    })

    // 连接错误
    ws.on('error', (err) => {
        console.error("websocket connect err: " + err)
    })

}
// 鉴权签名
function getAuthStr(date) {
    let signatureOrigin = `host: ${config.host}\ndate: ${date}\nGET ${config.uri} HTTP/1.1`
    let signatureSha = CryptoJS.HmacSHA256(signatureOrigin, config.apiSecret)
    let signature = CryptoJS.enc.Base64.stringify(signatureSha)
    let authorizationOrigin = `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
    let authStr = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(authorizationOrigin))
    return authStr
}
// 传输数据
function send(ws) {
    let vcn = "x4_lingyouyou_oral"
    if (getUserType() == 0) {
        vcn = "x4_lingyouyou_oral"
    } else if (getUserType() == 1) {
        vcn = "x4_lingxiaoxuan_oral"
    } else if (getUserType() == 2) {
        vcn = "x4_lingfeiyi_oral"
    }
    const data = {
        "header": { "app_id": config.appid, "status": 2 },
        "parameter": {
            "tts": {
                "vcn": vcn,  // 发音人参数，更换不同的发音人会有不同的音色效果
                "volume": 10,  // 设置音量大小
                "rhy": 0,  // 是否返回拼音标注		0:不返回拼音, 1:返回拼音（纯文本格式，utf8编码）
                "speed": 50,  // 设置合成语速，值越大，语速越快
                "pitch": 50,  // 设置振幅高低，可通过该参数调整效果
                "bgs": 0,  // 背景音	0:无背景音, 1:内置背景音1, 2:内置背景音2
                "reg": 0,  // 英文发音方式 	0:自动判断处理，如果不确定将按照英文词语拼写处理（缺省）, 1:所有英文按字母发音, 2:自动判断处理，如果不确定将按照字母朗读
                "rdn": 0,  // 合成音频数字发音方式	0:自动判断, 1:完全数值, 2:完全字符串, 3:字符串优先
                "audio": {
                    "encoding": "raw",  // 合成音频格式， lame 合成音频格式为mp3
                    "sample_rate": 16000,  // 合成音频采样率，	16000, 8000, 24000
                    "channels": 1,  // 音频声道数
                    "bit_depth": 8,  // 合成音频位深 ：16, 8
                    "frame_size": 0,
                },
            }
        },
        "payload": {
            "text": {
                "encoding": "utf8",
                "compress": "raw",
                "format": "plain",
                "status": 2,
                "seq": 0,
                "text": Buffer.from(config.text).toString('base64'), // 待合成文本base64格式
            }
        },
    }
    ws.send(JSON.stringify(data))
}

// 保存文件
function save(data) {
    fs.writeFile('./public/tts.pcm', data, { flag: 'a' }, (err) => {
        if (err) {
            console.error('save error: ' + err)
            return
        }
    })
    // console.info('文件保存成功')
}
export const startTTSAsync = (ws_buffer, text) => {
    let isBufferClose = false
    let isConnClose = false
    return new Promise((resolve) => {
        startTTS(
            text,
            () => {
                console.log("开始合成，立即播放");
            },
            (audioBuf) => {
                // const chunkSize = 3584;  // 每块数据的大小
                const chunkSize = 3328;  // 每块数据的大小
                let i = 0;
                const sendChunk = () => {
                    if (i < audioBuf.length) {
                        let chunk;
                        // 检查剩余数据是否足够一个完整的块
                        if (i + chunkSize <= audioBuf.length) {
                            chunk = audioBuf.slice(i, i + chunkSize);  // 获取完整的数据块
                        } else {
                            // 如果剩余数据不足一个块，填充到固定长度
                            chunk = new Uint8Array(chunkSize);  // 创建一个新的固定长度的数组
                            chunk.set(audioBuf.slice(i));  // 将剩余数据复制到新数组
                            // 填充剩余部分（例如用 0 填充）
                            chunk.fill(0, audioBuf.length - i);
                        }

                        ws_buffer.send(chunk);  // 发送数据块
                        i += chunkSize;  // 更新索引

                        // 继续发送下一个块
                        sendChunk()
                        //   setTimeout(sendChunk, 10);  // 控制发送速度
                    } else {
                        isBufferClose = true;
                        if (isConnClose) {
                            resolve();
                        }
                    }
                };
                // const sendChunk = () => {
                //     if (i < audioBuf.length) {
                //         const chunk = audioBuf.slice(i, i + chunkSize);
                //         ws_buffer.send(chunk);  // 发送数据块
                //         i += chunkSize;
                //         // setTimeout(sendChunk, 10);  // 控制发送速度
                //         sendChunk()
                //     } else {
                //         isBufferClose = true
                //         if (isConnClose) {
                //             resolve()
                //         }
                //     }
                // };

                sendChunk();  // 开始发送数据块
            },
            () => {
                console.log("合成结束");
                isConnClose = true
                if (isBufferClose) {
                    resolve()
                }
            }
        );
    });
};