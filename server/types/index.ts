
export interface RetryPolicy {
  maxRetries: number;
  delayMs: number;
}

export interface EventQueueConfig {
  concurrency: number;
  logger: any;
}
