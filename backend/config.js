// 0 小右 1 小露 2小飞
let user_type = 1
const setUserType = (_type) => {
  user_type = _type
}
const getUserType = () => {
  return user_type
}
const appid = "xxx"
const apiSecret = "xxx"
const apiKey = "xxxx"
export {
  setUserType,
  getUserType,
  appid,
  apiSecret,
  apiKey
}