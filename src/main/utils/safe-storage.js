const { safeStorage } = require('electron')
const Storage = require('electron-store')

const storage = new Storage({
  name: 'anilibrix_safe',
  clearInvalidConfig: true
})

export function remove (prop) {
  storage.delete(prop)
}

export function setEncrypted (prop, string) {
  if (!safeStorage.isEncryptionAvailable()) return false
  const encryptedString = safeStorage.encryptString(string)
    .toString('base64')
  storage.set(prop, encryptedString)
  return encryptedString
}

export function getDecrypted (prop) {
  if (!safeStorage.isEncryptionAvailable()) return false
  const data = storage.get(prop)
  if (data === undefined) return false
  const encryptedString = Buffer.from(
    data, 'base64'
  )

  return safeStorage.decryptString(encryptedString)
}
