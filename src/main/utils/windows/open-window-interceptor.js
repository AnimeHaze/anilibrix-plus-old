import { openLink } from '@main/utils/open-link';

function openWindowInterceptor (details) {
  if (
    details.url.startsWith('resource://') ||
    details.url.startsWith('https://oauth.vk.com/authorize') ||
    details.url.startsWith('https://id.vk.com/auth')
  ) {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        autoHideMenuBar: true
      }
    }
  }

  console.log('Open window', details.url)

  if (process.env.NODE_ENV === 'development' && details.url.startsWith('http://localhost:9080')) {
    return { action: 'deny' }
  }

  openLink(details.url)

  return { action: 'deny' }
}

export { openWindowInterceptor }
