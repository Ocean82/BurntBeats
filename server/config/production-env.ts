const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || '')
};

export interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  sessionSecret: string;
  corsOrigins: string[];
  required: {
    replId: string;
    databaseUrl: string;
  };
  optional: {
    stripeSecretKey?: string;
    stripeWebhookSecret?: string;
    openaiApiKey?: string;
    elevenLabsApiKey?: string;
    googleCloudKeyPath?: string;
  };
  health: {
    database: boolean;
    storage: boolean;
    stripe: boolean;
    ai: boolean;
  };
}

export function validateProductionEnvironment(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'production',
    databaseUrl: process.env.DATABASE_URL || '',
    sessionSecret: process.env.SESSION_SECRET || 'burnt-beats-secret-key',
    corsOrigins: process.env.NODE_ENV === 'production' 
      ? ['https://burnt-beats-sammyjernigan.replit.app'] 
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    required: {
      replId: process.env.REPL_ID || '',
      databaseUrl: process.env.DATABASE_URL || ''
    },
    optional: {
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      openaiApiKey: process.env.OPENAI_API_KEY,
      elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
      googleCloudKeyPath: process.env.GOOGLE_APPLICATION_CREDENTIALS
    },
    health: {
      database: !!process.env.DATABASE_URL,
      storage: true, // Local storage always available
      stripe: !!process.env.STRIPE_SECRET_KEY,
      ai: !!(process.env.OPENAI_API_KEY || process.env.ELEVENLABS_API_KEY)
    }
  };

  // Validate required environment variables
  const missingRequired = [];
  if (!config.required.databaseUrl) missingRequired.push('DATABASE_URL');
  
  if (missingRequired.length > 0) {
    logger.error('Missing required environment variables:', missingRequired);
    throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
  }

  // Log optional missing services
  const missingOptional = [];
  if (!config.optional.stripeSecretKey) missingOptional.push('STRIPE_SECRET_KEY');
  if (!config.optional.openaiApiKey) missingOptional.push('OPENAI_API_KEY');
  if (!config.optional.elevenLabsApiKey) missingOptional.push('ELEVENLABS_API_KEY');

  if (missingOptional.length > 0) {
    logger.warn('Optional environment variables not set:', missingOptional);
    logger.info('Some features may be disabled without these API keys');
  }

  logger.info('Environment validation complete', {
    port: config.port,
    nodeEnv: config.nodeEnv,
    hasDatabase: config.health.database,
    hasStripe: config.health.stripe,
    hasAI: config.health.ai
  });

  return config;
}

export function getServiceStatus(config: EnvironmentConfig) {
  return {
    database: config.health.database ? 'connected' : 'disconnected',
    storage: 'connected',
    payments: config.health.stripe ? 'connected' : 'mock_mode',
    ai_services: config.health.ai ? 'connected' : 'mock_mode',
    voice_cloning: config.optional.elevenLabsApiKey ? 'connected' : 'mock_mode',
    music_generation: 'connected' // Always available via Music21
  };
}