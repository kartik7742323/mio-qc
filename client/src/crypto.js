const ENC_SECRET = 'MioAdoption$Analytics#Key2024!XZ'

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

let _cachedKey = null
async function getKey() {
  if (_cachedKey) return _cachedKey
  const keyBytes = new TextEncoder().encode(ENC_SECRET)
  _cachedKey = await window.crypto.subtle.importKey(
    'raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']
  )
  return _cachedKey
}

export async function decryptResponse(payload) {
  const key = await getKey()
  const iv = hexToBytes(payload.iv)
  const ciphertext = hexToBytes(payload.data)
  const tag = hexToBytes(payload.tag)
  const combined = new Uint8Array(ciphertext.length + tag.length)
  combined.set(ciphertext)
  combined.set(tag, ciphertext.length)
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    combined
  )
  return JSON.parse(new TextDecoder().decode(decrypted))
}
