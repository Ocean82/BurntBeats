
import { EventQueueConfig } from '../types';

export class EventQueue {
  private concurrency: number;
  private logger: any;
  private running: number = 0;
  private queue: Array<() => Promise<void>> = [];

  constructor(config: EventQueueConfig) {
    this.concurrency = config.concurrency;
    this.logger = config.logger;
  }

  async add(task: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        try {
          await task();
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processNext();
        }
      };

      this.queue.push(wrappedTask);
      this.processNext();
    });
  }

  private processNext(): void {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (task) {
      this.running++;
      task();
    }
  }
}
