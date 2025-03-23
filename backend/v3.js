import axios from 'axios';
import path, { resolve } from 'path'
import { fileURLToPath } from 'url';
import express from 'express';
import WebSocket from 'ws';
import expressWs from 'express-ws'
import fs from 'fs'
import { startIAT_buffer } from './utils/iat_ws_node_js/iat-ws-node.js'
import { startTTSAsync } from './utils/tts_ws_node_js/tts-ws-node-super.js'
import { sendMsg } from './utils/gpt_ws_node_js/gpt.js';
import { getLocalIP } from './utils/redrun.js';
// console.log(import.meta.url);
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express();
const port = 3000

app.use(express.static(path.join(__dirname, 'public')));
expressWs(app);
let iat_controller
let isOpen
app.ws('/buffer', function (ws, req) {
  console.log('connect success')
  iat_controller = startIAT_buffer((str) => {
    console.log(str);
    iat_controller.end()
  }, () => {
    console.log("open");
    // 使用 on 方法监听事件
    //   message 事件表示从另一段（服务端）传入的数据
    isOpen = true
  })
  // let readerStream = fs.createReadStream("./public/close.pcm", {
  //   highWaterMark: 1280
  // });
  // readerStream.on('data', function (chunk) {
  //   ws.send(chunk)
  // });
  // // 最终帧发送结束
  // readerStream.on('end', function () {
  //   console.log("end");
  // });
  ws.send("ok")
  ws.on('message', function (msg) {
    if (isOpen) {
      console.log(msg.length);
      iat_controller && iat_controller.start(msg.toString('base64'))
    }
    ws.send("ok")
  })



  // close 事件表示客户端断开连接时执行的回调函数
  ws.on('close', function (e) {
    console.log('close connection')
  })
})
app.listen(port, () => {
  console.log(`${getLocalIP()}:${port}`);
})
