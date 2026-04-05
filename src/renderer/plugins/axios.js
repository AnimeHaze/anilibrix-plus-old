/* ============
 * Axios
 * ============
 *
 * Promise based HTTP client for the browser and node.js.
 * Because Vue Resource has been retired, Axios will now been used
 * to perform AJAX-requests.
 *
 * @see https://github.com/mzabriskie/axios
 *
 */
import Axios from 'axios'
import store from '@store'
import { clone, cloneDeep } from 'lodash'
import FormData from 'form-data'

// Set cookies
Axios.defaults.withCredentials = true
Axios.defaults.timeout = 5000

// Create axios
const axios = Axios.create()

function filterUnderscoredKeys (data) {
  return Object.keys(data).reduce((result, key) => {
    if (key.indexOf('_') !== 0) {
      result[key] = data[key]
    }
    return result
  }, {})
}

/**
 * Error handler function
 *
 * @param error
 * @return {Promise<never>}
 */
const responseErrorHandler = async error => {
  if (error && error.response) {
    if (error.response.status !== 401) {

      let headersList = {}
      if (error.config.headers) {
        const headers = clone(error.config.headers)
        if (headers.Cookie) {
          headers.Cookie = headers.Cookie
            .replace(/PHPSESSID=[^;]+;/g, 'PHPSESSID=REDACTED');
        }
        headersList = headers
      }

      console.error('Request failed', {
        message: error.message,
        url: error.config.url,
        headers: headersList,
        data: error.response.data,
        status: error.response.status
      });
    }
  } else if (error.request) {
    const req = filterUnderscoredKeys(cloneDeep(error.config))

    if (error.config.headers) {
      const headers = clone(error.config.headers)
      if (headers.Cookie) {
        headers.Cookie = headers.Cookie
          .replace(/PHPSESSID=[^;]+;/g, 'PHPSESSID=REDACTED');
      }
      req.headers.headers = headers
    }

    console.error('Request failed with no response', error.message, req)


    //
    // let dataObject = ''
    // const data = clone(error.config.data)
    // if (data && data instanceof FormData) {
    //   dataObject = data.getBuffer().toString('utf8')
    // } else if (data) {
    //   dataObject = JSON.stringify(data)
    // }
    //
    // console.error('Request error:', {
    //   message: error.message,
    //   url: error.config.url,
    //   headers: headersList,
    //   data: dataObject
    // })
  } else {
    console.error('Error while making request', error);
  }

  if (error && error.response) {
    // If server responded with not authorized:
    if (error.response.status === 401) {
      // Clear session and profile data
      await store.dispatch('app/account/setSession')
      await store.dispatch('app/account/setProfile')
    }
  }

  return Promise.reject(error)
}

// Add request && response interceptors
axios.interceptors.response.use(request => request, responseErrorHandler)

export default axios;
