import axios from 'axios';
import path, { resolve } from 'path'
import { fileURLToPath } from 'url';
import express from 'express';
import WebSocket from 'ws';
import expressWs from 'express-ws'
// 实时语音转文字
import { startIAT_buffer } from './utils/iat_ws_node_js/iat-ws-node.js'
// 实时超拟人语音合成
import { startTTSAsync } from './utils/tts_ws_node_js/tts-ws-node-super.js'
// 实时大模型对话
import { sendMsg } from './utils/gpt_ws_node_js/gpt.js';
// 获取ip地址
import { getLocalIP } from './utils/redrun.js';
// console.log(import.meta.url);
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// 单片机地址
let base_url = "192.168.43.136:5000"
// 向单片机发送音频数据进行实时语音播放
let ws_buffer = new WebSocket(`ws://${base_url}/buffer`)
ws_buffer.addEventListener("open", () => {
  console.log("open 向单片机发送音频数据进行实时语音播放");
  // startTTSAsync("哎哟我草")
})
let buffer_timer
ws_buffer.addEventListener("message", (e) => {
  if (buffer_timer) {
    clearTimeout(buffer_timer)
  }
  buffer_timer = setTimeout(() => {
    console.log(1);
  }, 1000)
  // console.log("ws_buffer", e.data);
})
ws_buffer.addEventListener("error", (e) => {
  console.log("ws_buffer");
})


const app = express();
// 解析 application/octet-stream 类型的请求体
// app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '10mb' }));
// body-parser 解析json格式数据
// app.use(bodyParser.json());  
// app.use(bodyParser.urlencoded({            //此项必须在 bodyParser.json 下面,为参数编码
//   extended: true
// }));
app.use(express.static(path.join(__dirname, 'public')));
expressWs(app);
/**
 * @typedef {Object} IATController
 * @property {function(Buffer): void} start - 开始方法.
 * @property {function(): void} end - 结束方法.
 */

/**
 * 实时语音合成
 * @type {IATController}
 */
let iat_controller;
let is_iat_connect_open = false
/**
 * 接受单片机发送过来音频数据进行实时语音文字识别
 * @type {WebSocket}
 */
let ws_send_buffer = new WebSocket(`ws://${base_url}/send_buffer`)
ws_send_buffer.addEventListener("open", () => {
  console.log("open 接受单片机发送过来音频数据进行实时语音文字识别");
})
ws_send_buffer.addEventListener("message", (e) => {
  if (is_iat_connect_open) {
    ws_send_buffer.send("pending")
    iat_controller.start(e.data)
  }
})
ws_send_buffer.addEventListener("error", (e) => {
  console.log("ws_send_buffer error");
})
ws_send_buffer.addEventListener("close", (e) => {
  console.log("ws_send_bufferclose");
})
/**
 * @type {NodeJS.Timeout}
 */
let timer
// 任务队列
const taskQueue = [];
let strLen = ""
let isProcessing = false; // 标志，表示当前是否有任务正在执行
// 串行执行任务的函数
async function processQueue() {
  if (isProcessing) return; // 如果正在处理任务，则直接返回
  isProcessing = true; // 标记为正在处理任务

  while (taskQueue.length > 0) {
    const task = taskQueue.shift(); // 从队列中取出一个任务
    try {
      await task(); // 执行任务，并等待其完成
      if (taskQueue.length < 1) {
        console.log("对话完成=============");
      }
    } catch (error) {
      console.error("任务执行失败:", error);
    }
  }

  isProcessing = false; // 标记为任务处理完成
}
let gptTimer
// 接受单片机发送的请求开始说话
app.get("/record", (req, res) => {
  console.log("record");
  iat_controller = startIAT_buffer((str) => {
    console.log(str);
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      // 语音转文字完成
      iat_controller.end()
      ws_send_buffer.send("ended")
      is_iat_connect_open = false
      if (!str) return
      sendMsg(str, async (msg, flag) => {
        console.log(msg);
        strLen += msg
        taskQueue.push(async () => {
          await startTTSAsync(ws_buffer, msg); // 等待 startTTSAsync 执行完成
        });
        processQueue()
        if (flag) {
          if (gptTimer) {
            clearTimeout(gptTimer)
          }
          gptTimer = setTimeout(() => {
            console.log("对话完成，开始下一句对话");
            // 向单片机发送请求，开始下一句对话
            axios.get(`http://${base_url}/new_chat`)
            strLen = ""
          }, strLen.length * 254)
        }

      })
    }, 500)
  }, () => {
    is_iat_connect_open = true
    ws_send_buffer.send('pending')
  })
  res.send("ok")

})
const port = 3000
app.listen(port, () => {
  console.log(`${getLocalIP()}:${port}`);
})
