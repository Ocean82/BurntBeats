// Environment configuration without dotenv dependency
import path from 'path';

// Environment variables are automatically loaded by the runtime

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'NODE_ENV',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Missing environment variable: ${envVar}`);
  }
}

// Parse whitelisted IPs
const parseWhitelistedIps = (ips?: string): string[] => {
  if (!ips) return [];
  return ips.split(',').map(ip => ip.trim());
};

// Configuration object
export const env = {
  // Core
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_VERSION: process.env.APP_VERSION || '1.0.0',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_WHITELISTED_IPS: parseWhitelistedIps(process.env.STRIPE_WHITELISTED_IPS),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Support
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'support@burntbeats.app',

  // Security
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false',
  IP_FILTER_ENABLED: process.env.IP_FILTER_ENABLED !== 'false',

  // Optional Audio Processing
  AI_MODEL_PATH: process.env.AI_MODEL_PATH || '',
  TACOTRON2_API_URL: process.env.TACOTRON2_API_URL || '',
  RVC_MODEL_PATH: process.env.RVC_MODEL_PATH || '',
  DIFFUSION_MODEL_URL: process.env.DIFFUSION_MODEL_URL || '',
  ESPEAK_NG_PATH: process.env.ESPEAK_NG_PATH || '',
  CMUDICT_PATH: process.env.CMUDICT_PATH || '',

  // Google Cloud Storage - using individual environment variables for security
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  GOOGLE_CLOUD_PRIVATE_KEY: process.env.GOOGLE_CLOUD_PRIVATE_KEY || '',
  GOOGLE_CLOUD_CLIENT_EMAIL: process.env.GOOGLE_CLOUD_CLIENT_EMAIL || '',
  GOOGLE_CLOUD_BUCKET: process.env.GOOGLE_CLOUD_BUCKET || 'burnt-beats-storage',

  // Model and File Storage Configuration
  MODEL_CACHE_PATH: process.env.MODEL_CACHE_PATH || '/tmp/models',
  STORAGE_BASE_PATH: process.env.STORAGE_BASE_PATH || './storage',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE, 10) : 50 * 1024 * 1024, // 50MB
  TEMP_CLEANUP_INTERVAL: process.env.TEMP_CLEANUP_INTERVAL ? parseInt(process.env.TEMP_CLEANUP_INTERVAL, 10) : 3600000, // 1 hour

  // Health API Configuration
  HEALTH_API_KEY: process.env.HEALTH_API_KEY || 'health-check-key-dev',
};

// Type-safe environment export
export type EnvConfig = typeof env;
export default env;