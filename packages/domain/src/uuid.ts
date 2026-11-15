/**
 * Generates an RFC 9562 compliant UUIDv7.
 * Encodes Unix timestamp in the high 48 bits for temporal locality and sorting.
 */
export function generateUuidV7(): string {
  const timestamp = Date.now();
  const bytes = new Uint8Array(16);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for environments where crypto is not globally bound
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // 48-bit timestamp in big-endian
  bytes[0] = (timestamp / 0x10000000000) & 0xff;
  bytes[1] = (timestamp / 0x100000000) & 0xff;
  bytes[2] = (timestamp / 0x1000000) & 0xff;
  bytes[3] = (timestamp / 0x10000) & 0xff;
  bytes[4] = (timestamp / 0x100) & 0xff;
  bytes[5] = timestamp & 0xff;

  // version 7 (0111) in bits 48..51
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  // variant 1 (10) in bits 64..65
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  let hex = '';
  for (let i = 0; i < 16; i++) {
    const byte = bytes[i].toString(16).padStart(2, '0');
    hex += byte;
    if (i === 3 || i === 5 || i === 7 || i === 9) {
      hex += '-';
    }
  }

  return hex;
}
