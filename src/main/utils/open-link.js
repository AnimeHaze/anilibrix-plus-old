import { shell } from 'electron';

export function openLink(u) {
  try {
    // eslint-disable-next-line no-new
    const url = new URL(u)

    if (['tg:', 'http:', 'https:'].includes(url.protocol)) {
      shell.openExternal(url.toString()).catch(e => console.error(e))
    } else {
      console.error('Invalid URL protocol', url)
    }
  } catch (e) {
    console.error(e)
  }
}
