import { getParams, getWebSocketUrl } from "../redrun.js";
import Functions from "../functions/functions.js";
import WebSocket from 'ws'
import { getUserType, apiKey, appid, apiSecret } from "../../config.js";
const config = {
  hostUrl: "wss://spark-api.xf-yun.com/v4.0/chat",
  appid,
  userId: "red润",
  domain: '4.0Ultra',
  apiSecret,
  apiKey,

};
let chatHistoryList_sister = [{
  "content": `你是小右，你是一个呆呆的小朋友，说话很呆呆的,你五岁了，你有一个哥哥和一个姐姐`,
  "role": "system",
  "index": 0
}
]
let chatHistoryList_elder_sister = [{
  "content": `你是小鹿，你是一个聪明智慧的美丽的女生，说话很冷静有条理`,
  "role": "system",
  "index": 0
}
]
let chatHistoryList_brother = [{
  "content": `你是小飞，你是一个清爽帅气的男生，说话很暖`,
  "role": "system",
  "index": 0
}
]
let chatHistoryList = chatHistoryList_sister


/**
 * @type {WebSocket}
 */
let websocket = null;
export const sendMsg = async (content, onReceiveMessage) => {
  if (getUserType() == 0) {
    chatHistoryList = chatHistoryList_sister
  } else if (getUserType() == 1) {
    chatHistoryList = chatHistoryList_elder_sister

  } else if (getUserType() == 2) {
    chatHistoryList = chatHistoryList_brother

  }
  let answer = "";// 回答
  let tempAnswerLen = 0;
  chatHistoryList.push({ role: 'user', content });
  let params = getParams(config.appid, config.userId, config.domain, chatHistoryList);
  let url = getWebSocketUrl(config.hostUrl, config.apiKey, config.apiSecret);
  websocket = new WebSocket(url);
  websocket.addEventListener('open', (event) => {
    console.log('GPT 开启连接！！', event);
    websocket.send(JSON.stringify(params));
  });
  websocket.addEventListener('error', (error) => {
    console.log('GPT 连接发送错误！！', error);
  });
  websocket.addEventListener('message', async (event) => {
    let data = JSON.parse(event.data)
    // console.log('收到消息！！',data);
    if (data.header.code !== 0) {
      console.log("GPT 出错了", data.header.code, ":", data.header.message);
      // 出错了"手动关闭连接"
      websocket.close()
    }
    if (data.header.code === 0) {
      // 对话已经完成
      if (data.payload.choices.text && data.header.status === 2) {
        let function_call = data?.payload?.choices?.text[0]?.function_call;
        if (function_call) {
          console.log(function_call);
          let name = function_call.name;
          let params = JSON.parse(function_call.arguments);
          // console.log(name,params);
          let target = Functions.getFunctionByName(name);
          if (target) {
            // 返回一个promise，可以自定义answer返回答案
            let res = await target.handler(params)
            console.log(res);
            // answer = `已为您处理任务：${name}，参数：${JSON.stringify(params)}`
            answer = res
          }
          // 默认回答

          chatHistoryList.push({
            role: 'assistant',
            content: answer,
          });
          // onReceiveMessage(answer, true);
          onReceiveMessage(answer, true);
          answer = '';
          tempAnswerLen = 0;
          websocket.close()
        } else {
          answer += data.payload.choices.text[0].content;
          let tempAnswer = answer.slice(tempAnswerLen)
          chatHistoryList.push({
            role: 'assistant',
            content: answer,
          });
          // onReceiveMessage(answer, true);
          onReceiveMessage(tempAnswer, true);
          answer = '';
          tempAnswerLen = 0;
          websocket.close()
        }
      } else {
        answer += data.payload.choices.text[0].content
        if (answer.length > (20 + tempAnswerLen)) {
          // 发送这些元素
          let tempAnswer = answer.slice(tempAnswerLen);
          onReceiveMessage(tempAnswer, false);
          tempAnswerLen = answer.length;
        }
      }
    }
  })
  websocket.addEventListener('close', (event) => {
    console.log('GPT 聊天完成关闭', event);
    // 对话完成后socket会关闭，将聊天记录换行处理
  });
}
