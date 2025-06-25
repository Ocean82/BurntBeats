
export function validateEnvironmentVariables() {
  const required = [
    'DATABASE_URL',
  ];

  const optional = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NODE_ENV',
    'OPENAI_API_KEY',
    'ELEVENLABS_API_KEY',
    'AI_MODEL_PATH',
    'PORT'
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
    }
  };
}
