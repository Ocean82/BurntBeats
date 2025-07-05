
import { Logger } from '../utils/logger';

interface WebhookEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  expectedStatus: number;
}

export class WebhookHealthService {
  private logger = new Logger({ name: 'WebhookHealthService' });
  private endpoints: WebhookEndpoint[] = [
    {
      name: 'Stripe Webhook',
      url: '/api/stripe-webhook',
      method: 'GET',
      expectedStatus: 405 // Method not allowed for GET is expected
    },
    {
      name: 'Enhanced Stripe Webhook',
      url: '/api/stripe-webhook-enhanced',
      method: 'GET', 
      expectedStatus: 405
    },
    {
      name: 'Webhook Test',
      url: '/api/webhook-test',
      method: 'GET',
      expectedStatus: 200
    }
  ];

  async checkWebhookHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    endpoints: Array<{
      name: string;
      status: 'up' | 'down';
      responseTime: number;
      error?: string;
    }>;
  }> {
    const results = [];
    let healthyCount = 0;

    for (const endpoint of this.endpoints) {
      const startTime = Date.now();
      try {
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
          : `http://localhost:${process.env.PORT || 8080}`;

        const response = await fetch(`${baseUrl}${endpoint.url}`, {
          method: endpoint.method,
          timeout: 5000
        });

        const responseTime = Date.now() - startTime;
        const isHealthy = response.status === endpoint.expectedStatus;

        if (isHealthy) healthyCount++;

        results.push({
          name: endpoint.name,
          status: isHealthy ? 'up' : 'down',
          responseTime,
          error: isHealthy ? undefined : `Expected ${endpoint.expectedStatus}, got ${response.status}`
        });

      } catch (error) {
        results.push({
          name: endpoint.name,
          status: 'down',
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const status = healthyCount === this.endpoints.length ? 'healthy' :
                  healthyCount > 0 ? 'degraded' : 'unhealthy';

    this.logger.info('Webhook health check completed', {
      status,
      healthyEndpoints: healthyCount,
      totalEndpoints: this.endpoints.length
    });

    return { status, endpoints: results };
  }
}
