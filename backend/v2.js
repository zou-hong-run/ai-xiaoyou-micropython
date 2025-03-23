import axios from 'axios';
import path, { resolve } from 'path'
import { fileURLToPath } from 'url';
import express from 'express';
import WebSocket from 'ws';
import expressWs from 'express-ws'
import { startIAT_buffer } from './utils/iat_ws_node_js/iat-ws-node.js'
import { startTTSAsync } from './utils/tts_ws_node_js/tts-ws-node-super.js'
import { sendMsg } from './utils/gpt_ws_node_js/gpt.js';
// console.log(import.meta.url);
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
let url = "http://192.168.43.136:5000"
let ws_buffer = new WebSocket("ws://192.168.43.136:5000/buffer")
ws_buffer.addEventListener("open", () => {
  console.log("open");
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
  console.log(e);
})


const app = express();
// 解析 application/octet-stream 类型的请求体
// app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '10mb' }));
// app.use(bodyParser.json());  //body-parser 解析json格式数据
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
 * @type {IATController}
 */
let iat_controller;
let is_iat_connect_open = false
/**
 * 发送buffer到后端
 * @type {WebSocket}
 */
let ws_send_buffer = new WebSocket("ws://192.168.43.136:5000/send_buffer")
ws_send_buffer.addEventListener("open", () => {
  console.log("open");
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
app.get("/record", (req, res) => {
  console.log("record");
  iat_controller = startIAT_buffer((str) => {
    console.log(str);
    // ws_send_buffer.close()
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      iat_controller.end()
      is_iat_connect_open = false
      if (!str) return
      sendMsg(str, async (msg, flag) => {
        console.log(msg);
        // if (flag) {
        //   console.log("对话完成");
        //   // axios.get("http://192.168.43.136:5000/new_chat")
        // }
        strLen += msg

        taskQueue.push(async () => {
          await startTTSAsync(ws_buffer, msg); // 等待 startTTSAsync 执行完成
          // axios.get("http://192.168.43.136:5000/new_chat")
        });
        processQueue()

        if (flag) {
          if (gptTimer) {
            clearTimeout(gptTimer)
          }
          gptTimer = setTimeout(() => {
            console.log("下一句");
            axios.get(`${url}/new_chat`)
            strLen = ""
          }, strLen.length * 254)
        }

      })
    }, 500)
  }, () => {
    is_iat_connect_open = true

    ws_send_buffer.send('pedding')
  })
  res.send("ok")

})
app.listen(3000, () => {
  console.log(3000);
})
