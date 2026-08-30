import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface DbConfig {
  host: string;
  user: string;
  password?: string;
  database: string;
  port: number;
}

// Obfuscated filename to prevent easy discovery
const CONFIG_FILE = path.join(process.cwd(), 'database.config.enc');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const TAG_LENGTH = 16;

/**
 * Derives a consistent 32-byte key from the AUTH_SECRET.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // In production, this should NEVER happen if the setup is done correctly.
    // However, during the initial setup run, we might need a placeholder or just fail.
    // We'll use a constant for the very first initialization if no secret is found,
    // but AUTH_SECRET should be present in any modern NextAuth app.
    return crypto.createHash('sha256').update('active-voucher-default-fallback-security-key').digest();
  }
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts data using AES-256-GCM.
 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Return as IV:TAG:DATA
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts data using AES-256-GCM.
 */
function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted format');

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Encryption verification failed. Access denied.');
  }
}

export function getDbConfig(): DbConfig | null {
  try {
    // Check for both old (json) and new (enc) for migration support or just start fresh
    if (fs.existsSync(CONFIG_FILE)) {
      const encryptedData = fs.readFileSync(CONFIG_FILE, 'utf8');
      const decryptedData = decrypt(encryptedData);
      return JSON.parse(decryptedData) as DbConfig;
    }
    
    // Legacy support (optional, can be removed after migration)
    const legacyFile = path.join(process.cwd(), 'database.json');
    if (fs.existsSync(legacyFile)) {
      const data = fs.readFileSync(legacyFile, 'utf8');
      const config = JSON.parse(data) as DbConfig;
      // Auto-migrate to encrypted
      saveDbConfig(config);
      // Remove legacy file
      try { fs.unlinkSync(legacyFile); } catch (e) {}
      return config;
    }
  } catch (error) {
    console.error('CRITICAL SECURITY: Database configuration could not be decrypted.');
  }
  return null;
}

export function saveDbConfig(config: DbConfig): boolean {
  try {
    const data = JSON.stringify(config);
    const encryptedData = encrypt(data);
    fs.writeFileSync(CONFIG_FILE, encryptedData, 'utf8');
    clearConfigCache(); // Clear cache so the next check reads the new file
    return true;
  } catch (error) {
    console.error('Error saving encrypted database config:', error);
    return false;
  }
}

// Check if the config file exists and is decryptable
export function isDbConfigured(): boolean {
  try {
    const config = getDbConfig();
    return !!(config && config.host && config.database && config.user);
  } catch (e) {
    return false;
  }
}

/**
 * Force clear the cache (legacy helper, now a no-op since caching is disabled)
 */
export function clearConfigCache() {
  // Caching is disabled to ensure instant config detection on page load
}

export function deleteDbConfig(): boolean {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
    const legacyFile = path.join(process.cwd(), 'database.json');
    if (fs.existsSync(legacyFile)) {
      fs.unlinkSync(legacyFile);
    }
    clearConfigCache();
    return true;
  } catch (error) {
    console.error('Error deleting database config:', error);
    return false;
  }
}
