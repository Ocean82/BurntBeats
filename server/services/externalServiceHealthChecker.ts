
import { Logger } from '../utils/logger';
import { env } from '../config/env';

const logger = new Logger({ name: 'ExternalServiceHealthChecker' });

interface ServiceStatus {
  name: string;
  status: string;
  responseTime?: number;
  error?: string;
}

export class ExternalServiceHealthChecker {
  static async checkAll(): Promise<ServiceStatus[]> {
    const services = [
      { name: 'Stripe API', url: 'https://api.stripe.com/v1', enabled: !!env.STRIPE_SECRET_KEY },
      { name: 'OpenAI API', url: 'https://api.openai.com/v1', enabled: !!env.OPENAI_API_KEY },
      { name: 'ElevenLabs API', url: 'https://api.elevenlabs.io/v1', enabled: !!env.ELEVENLABS_API_KEY },
    ].filter(service => service.enabled);

    if (services.length === 0) {
      return [{
        name: 'External Services',
        status: 'none-configured',
      }];
    }

    const results = await Promise.all(
      services.map(service => this.checkService(service))
    );

    return results;
  }

  private static async checkService(service: { name: string; url: string }): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(service.url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'HealthCheck/1.0' }
      });

      clearTimeout(timeoutId);

      return {
        name: service.name,
        status: response.ok ? 'available' : 'unavailable',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        name: service.name,
        status: 'unavailable',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
}
