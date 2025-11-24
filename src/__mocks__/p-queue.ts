/**
 * Mock implementation of p-queue for Jest testing
 */
export default class PQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private readonly concurrency: number;

  constructor(options?: { concurrency?: number }) {
    this.concurrency = options?.concurrency || Infinity;
  }

  async add<T>(fn: () => Promise<T>, _options?: { priority?: number }): Promise<T> {
    // Simple implementation: just run immediately if under concurrency
    if (this.running < this.concurrency) {
      this.running++;
      try {
        return await fn();
      } finally {
        this.running--;
      }
    }

    // Otherwise queue it
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  clear(): void {
    this.queue = [];
  }

  get size(): number {
    return this.queue.length;
  }

  get pending(): number {
    return this.running;
  }

  onEmpty(): Promise<void> {
    return Promise.resolve();
  }

  onIdle(): Promise<void> {
    return Promise.resolve();
  }
}
