
import { env } from '../config/env';

export async function validateStripeConfiguration(): Promise<boolean> {
  console.log('🔍 Validating Stripe configuration...');

  const errors: string[] = [];

  // Check required environment variables
  if (!env.STRIPE_SECRET_KEY) {
    errors.push('STRIPE_SECRET_KEY is required');
  } else if (!env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    errors.push('STRIPE_SECRET_KEY should start with sk_');
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    errors.push('STRIPE_WEBHOOK_SECRET is required for production');
  } else if (!env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
    errors.push('STRIPE_WEBHOOK_SECRET should start with whsec_');
  }

  if (!env.STRIPE_PUBLIC_KEY) {
    errors.push('VITE_STRIPE_PUBLIC_KEY is required for frontend');
  } else if (!env.STRIPE_PUBLIC_KEY.startsWith('pk_')) {
    errors.push('VITE_STRIPE_PUBLIC_KEY should start with pk_');
  }

  // Test Stripe API connection
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    
    await stripe.accounts.retrieve();
    console.log('✅ Stripe API connection successful');
  } catch (error) {
    errors.push(`Stripe API connection failed: ${error}`);
  }

  if (errors.length > 0) {
    console.error('❌ Stripe configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    return false;
  }

  console.log('✅ Stripe configuration is valid!');
  return true;
}

// Run validation if called directly
if (require.main === module) {
  validateStripeConfiguration().then(isValid => {
    process.exit(isValid ? 0 : 1);
  });
}
