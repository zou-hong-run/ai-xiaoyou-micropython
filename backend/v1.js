import axios from 'axios'
import fs from 'fs'
import path, { resolve } from 'path'
import { fileURLToPath } from 'url';
import express from 'express';

import expressWs from 'express-ws'
import { startIAT, startIAT_buffer } from './iat_ws_nodejs_demo/iat-ws-node.js'
import { startTTS } from './tts-ws-node-super.js'
import { sendMsg } from './GPTS.js';
import bodyParser from 'body-parser'
// console.log(import.meta.url);
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// const downloadPCM = async (url, savePath) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       // 发送 GET 请求，获取 PCM 文件
//       const response = await axios({
//         method: 'get',
//         url: url,
//         responseType: 'stream',  // 关键：使用流的方式接收响应
//       });
//       // 创建一个写入流，将数据保存到本地文件
//       const writer = fs.createWriteStream(savePath);
//       // 将响应流（PCM文件）管道到写入流
//       response.data.pipe(writer);
//       // 等待文件写入完成
//       writer.on('finish', () => {
//         resolve()
//         console.log(`文件已下载并保存到: ${savePath}`);
//       });

//       writer.on('error', (err) => {
//         reject()
//         console.error('下载或保存文件时出错:', err);
//       });

//     } catch (error) {
//       console.error('请求过程中出错:', error);
//     }
//   })


// };
// let ws = new WebSocket("ws://192.168.43.136:5000/buffer")
// ws.addEventListener("open", () => {
//   console.log("open");
// })
// ws.addEventListener("message", (e) => {
//   console.log(e);
// })
// ws.addEventListener("error", (e) => {
//   console.log(e);
// })
// const startTTSAsync = (text) => {
//   return new Promise((resolve) => {
//     startTTS(
//       text,
//       () => {
//         console.log("开始合成，立即播放");
//         // axios.get("http://192.168.43.136:5000/play?open=0");
//       },
//       (audioBuf) => {
//         const chunkSize = 3584;  // 每块数据的大小
//         let i = 0;

//         const sendChunk = () => {
//           if (i < audioBuf.length) {
//             const chunk = audioBuf.slice(i, i + chunkSize);
//             ws.send(chunk);  // 发送数据块
//             i += chunkSize;
//             // setTimeout(sendChunk, 10);  // 控制发送速度
//             sendChunk()
//           }
//           //  else {
//           //   resolve();  // 数据发送完成，继续下一段文本
//           // }
//         };

//         sendChunk();  // 开始发送数据块
//       },
//       () => {
//         console.log("合成结束");
//         resolve();
//       }
//     );
//   });
// };
const app = express();
// 解析 application/octet-stream 类型的请求体
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '10mb' }));
// app.use(bodyParser.json());  //body-parser 解析json格式数据
// app.use(bodyParser.urlencoded({            //此项必须在 bodyParser.json 下面,为参数编码
//   extended: true
// }));
app.use(express.static(path.join(__dirname, 'public')));
app.get("/play", async (req, res) => {
  console.log("单片机发来播放1");
  res.send({
    code: 200,
    msg: "ok"
  })
  // 示例调用
  // const url = 'http://192.168.0.103:5000/media';  // PCM文件的URL
  // const savePath = path.resolve(__dirname, 'downloaded_file.pcm');  // 本地保存路径
  // await downloadPCM(url, savePath);
  // console.log("下载远程音频2");

  startIAT((str) => {
    // 识别单片机语音
    // console.log("识别单片机语音3");
    console.log(str);
    // return
    let arr = []
    let isPlay = false
    sendMsg(str, async (answer, flag) => {
      console.log(answer);
      arr.push(answer)
      if (!isPlay) {
        isPlay = true
        while (arr.length > 0) {
          console.log("???");
          let text = arr.shift()
          if (text) {
            await startTTSAsync(text)
          }
        }
      }
    })

  })

})
let stopFlag = false;
// startIAT((str) => {
//   console.log(str);
// })

let timer
// 音频数据接收接口
// app.post('/audio-stream', (req, res) => {
// if (stopFlag) {
//   return res.status(400).send('closed');
// }
// /**
//  * @type {Buffer}
//  */
// const audioData = req.body; // 获取音频数据
// console.log(1);
// fs.writeFile(`./public/tetetet.pcm`, audioData, { flag: 'a' }, (err) => {
//   if (err) {
//     console.error('save error: ' + err)
//     return
//   }
// })

// // console.log(audioData.length);
// // iat_controller.start(audioData)
// res.send("opening")
// // if (timer) {
// //   clearTimeout(timer)
// // }
// // timer = setTimeout(() => {
// //   iat_controller.end()
// // }, 500)

// });

// let iat_controller = startIAT_buffer((str) => {
//   console.log(str);
//   stopFlag = true
//   iat_controller.end()
// })
// let timer
// 音频数据接收接口
// app.post('/audio-stream', (req, res) => {
//   if (stopFlag) {
//     return res.status(400).send('closed');
//   }
//   const audioData = req.body.audio; // 获取音频数据
//   // console.log(audioData);
//   iat_controller.start(audioData)
//   res.send("opening")
//   if (timer) {
//     clearTimeout(timer)
//   }
//   timer = setTimeout(() => {
//     iat_controller.end()
//   }, 500)

// });
expressWs(app);

app.ws('/socketTest', function (ws, req) {
  let iat_controller = startIAT_buffer((str) => {
    console.log(str);
    iat_controller.end()
  }, () => {
    ws.send('ok')
    ws.on('message', function (message) {
      // console.log(message);
      if (message.endsWith('==') || message.endsWith('=')) {  // Base64 结束标志
        iat_controller.start(message)
      }

    })
  })

})
app.listen(3000, () => {
  console.log(3000);
})
