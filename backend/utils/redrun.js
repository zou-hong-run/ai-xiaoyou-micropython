import CryptoJS from "crypto-js";
import Functions from './functions/functions.js'

import os from 'os'
// 获取本机的所有网络接口
const networkInterfaces = os.networkInterfaces();

// 遍历网络接口，获取有效的 IPv4 地址
export const getLocalIP = () => {
  for (let interfaceName in networkInterfaces) {
    for (let interfaceDetails of networkInterfaces[interfaceName]) {
      // 检查是否为 IPv4 地址，并且是局域网地址
      if (interfaceDetails.family === 'IPv4' && !interfaceDetails.internal) {
        return interfaceDetails.address;
      }
    }
  }
  return null;  // 如果没有找到合适的 IP 地址
}

// console.log(getWebSocketUrl(config.apiKey, config.apiSecret));
// wss://iat-api.xfyun.cn/v2/iat
// wss://spark-api.xf-yun.com/v4.0/chat
// wss://tts-api.xfyun.cn/v2/tts
export const getWebSocketUrl = (url, apiKey, apiSecret) => {
  // 请求地址根据语种不同变化
  var host = new URL(url).host;
  var uri = new URL(url).pathname;
  var date = new Date().toGMTString();
  var algorithm = "hmac-sha256";
  var headers = "host date request-line";
  var signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${uri} HTTP/1.1`;
  var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
  var signature = CryptoJS.enc.Base64.stringify(signatureSha);
  var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
  var authorization = btoa(authorizationOrigin);
  url = `${url}?authorization=${authorization}&date=${date}&host=${host}`;
  return url;
}

export const encodeText = (text, type) => {
  if (type === "unicode") {
    let buf = new ArrayBuffer(text.length * 4);
    let bufView = new Uint16Array(buf);
    for (let i = 0, strlen = text.length; i < strlen; i++) {
      bufView[i] = text.charCodeAt(i);
    }
    let binary = "";
    let bytes = new Uint8Array(buf);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } else {
    return Buffer.from(text).toString("base64")
    // return Base64.encode(text);
  }
}
export const getParams = (appid, userId, domain, textList) => {
  let functions = Functions.getFunctions()
  let params = {
    "header": {
      "app_id": appid,
      "uid": userId
    },
    "parameter": {
      "chat": {
        "domain": domain,
        "temperature": 0.5,
        "max_tokens": 4096,
      }
    },
    "payload": {
      "message": {
        // 如果想获取结合上下文的回答，需要开发者每次将历史问答信息一起传给服务端，如下示例
        // 注意：text里面的所有content内容加一起的tokens需要控制在8192以内，开发者如有较长对话需求，需要适当裁剪历史信息
        "text": textList
      },
      "functions": {
        "text": functions
      }
    }
  };
  return params;
}