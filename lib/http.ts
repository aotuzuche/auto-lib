import axios from 'axios'
import { clearToken, toLogin, getToken } from './token'

type HttpConfig = {
  resCode?: string
  resMsg?: string
  data?: any
}

export interface ProcessEnv {
  [key: string]: string | undefined
}

class HttpError extends Error {
  msg: string
  name: string = 'HttpError'
  data: any
  code?: string = '0'
  constructor(message: string, data?: HttpConfig) {
    super(message)

    this.msg = message
    if (data) {
      this.data = data ? (data.data ? data.data : data) : null
      this.code = data.resCode
    }
  }
}

const config = {
  production: '/',
  development: 'proxy',
  test: '/'
}

/**
 * 获取config配置中的请求前置路径
 */

if (!process.env.PACKAGE) {
  process.env.PACKAGE = 'development'
}

const baseURL = config[process.env.PACKAGE]

/**
 * 配置axios
 */
export const http = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json;version=3.0;compress=false',
    'Content-Type': 'application/json;charset=utf-8'
  },
  data: {}
})

/**
 * 请求拦截器，在发起请求之前
 */
http.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers['Atzuche-Token'] = token
  }
  if (config.method === 'get') {
    if (typeof config.params !== 'object') {
      config.params = {}
    }

    config.params.requestId = Number(new Date())
  }

  if (Object.keys(config.data).length > 0) {
    config.data.requestId = Number(new Date())
  }

  return config
})

/**
 * 接口响应拦截器，在接口响应之后
 */
http.interceptors.response.use(
  config => {
    // 响应正常
    if (config.data.resCode === '000000') {
      return config.data.data
    }
    // 需要登录（没登录或登录过期）
    else if (config.data.resCode === '200008') {
      clearToken()
      toLogin()
      return false
    }
    // 需要绑定
    else if (config.data.resCode === '200101') {
      toLogin({
        isBind: true
      })
      return false
    }

    // 判断微信
    if (
      config.data.appId &&
      config.data.nonceStr &&
      config.data.signature &&
      config.data.timestamp
    ) {
      return config.data
    }

    // reject错误处理
    return Promise.reject(new HttpError(config.data.resMsg, config.data))
  },
  error => {
    // reject错误处理
    return Promise.reject(new HttpError('系统错误'))
  }
)
