import request from 'request'
import { promisify } from 'util'
import qs from 'qs'

const requestPromise = promisify(request)

export default async (options) => {
  options.method = options.method.toUpperCase()
  if (options.method === 'GET') {
    if (options.params) {
      let params = qs.stringify(options.params)
      options.url = `${options.url}?${params}`
    }
  }

  if (
    options.method === 'POST' ||
    options.method === 'PUT' ||
    options.method === 'DELETE'
  ) {
    if (options.body) {
      options.body = JSON.stringify(options.body)
    }
    if (!options.headers) {
      options.headers = {}
    }
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }
  }

  try {
    const res = await requestPromise(options)
    return {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      headers: res.headers,
      body: res.body
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: -1,
      statusMessage: err,
      body: { err_no: 1 }
    }
  }
}
