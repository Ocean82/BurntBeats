// Environment variable stubs for deployment readiness
// These provide fallback values for optional services during development

export const ENV_STUBS = {
  // Stripe webhook secret - optional for development
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dev_stub_for_testing',
  
  // AI service keys - optional for basic functionality
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
  
  // Local AI model paths - optional
  AI_MODEL_PATH: process.env.AI_MODEL_PATH || './models/default',
  TACOTRON2_API_URL: process.env.TACOTRON2_API_URL || '',
  RVC_MODEL_PATH: process.env.RVC_MODEL_PATH || './models/rvc',
  DIFFUSION_MODEL_URL: process.env.DIFFUSION_MODEL_URL || '',
  
  // Phoneme libraries - optional
  ESPEAK_NG_PATH: process.env.ESPEAK_NG_PATH || '/usr/bin/espeak-ng',
  CMUDICT_PATH: process.env.CMUDICT_PATH || './data/cmudict'
};

// Apply stubs only in development
export function applyEnvironmentStubs() {
  if (process.env.NODE_ENV === 'development') {
    Object.entries(ENV_STUBS).forEach(([key, value]) => {
      if (!process.env[key] && value) {
        process.env[key] = value;
        console.log(`📝 Using stub for ${key}`);
      }
    });
  }
}