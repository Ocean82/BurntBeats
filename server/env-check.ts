
export function validateEnvironmentVariables() {
  const required = [
    'DATABASE_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
  ];

  const optional = [
    'STRIPE_WEBHOOK_SECRET',
    'NODE_ENV',
    'OPENAI_API_KEY',
    'ELEVENLABS_API_KEY',
    'AI_MODEL_PATH',
    'PORT',
    'TACOTRON2_API_URL',
    'RVC_MODEL_PATH',
    'DIFFUSION_MODEL_URL',
    'ESPEAK_NG_PATH',
    'CMUDICT_PATH'
  ];

  // Production-specific validation
  if (process.env.NODE_ENV === 'production') {
    const productionRequired = ['NODE_ENV', 'PORT'];
    productionRequired.forEach(key => {
      if (!required.includes(key)) {
        required.push(key);
      }
    });
  }

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ Required environment variables present');
  
  const missingOptional = optional.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn('⚠️  Missing optional environment variables:', missingOptional);
  }

  return {
    database: !!process.env.DATABASE_URL,
    stripe: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY),
    webhooks: !!process.env.STRIPE_WEBHOOK_SECRET,
    aiServices: {
      openai: !!process.env.OPENAI_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      localModel: !!process.env.AI_MODEL_PATH
    },
    neuralSynthesis: {
      tacotron2: !!process.env.TACOTRON2_API_URL,
      rvc: !!process.env.RVC_MODEL_PATH,
      diffusion: !!process.env.DIFFUSION_MODEL_URL
    },
    phonemeLibraries: {
      espeak: !!process.env.ESPEAK_NG_PATH,
      cmudict: !!process.env.CMUDICT_PATH
    }
  };
}
