import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16); // Initialization vector

function getKey(password: string): Buffer {
  // Derive a key from the password using PBKDF2
  return crypto.pbkdf2Sync(password, 'salt', 100000, 32, 'sha512');
}

export function encrypt(text: string, password: string): string {
  const key = getKey(password);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string, password: string): string {
  const [ivHex, encryptedText] = encrypted.split(':');
  const ivBuffer = Buffer.from(ivHex, 'hex');
  const key = getKey(password);
  const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function generateHash(code: string): string {
  const hash = crypto.createHash('sha256').update(code).digest('base64');
  const urlSafeHash = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return urlSafeHash.substring(0, 43);
}
