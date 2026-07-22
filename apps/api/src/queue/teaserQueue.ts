import { Queue } from 'bullmq';
import { redisConnectionOptions } from './redis.connection.js';

export const TEASER_QUEUE_NAME = 'teaser-generation-queue';

export interface TeaserJobData {
  jobId: string;
  articleId: string;
  title: string;
  content: string;
}

export const teaserQueue = new Queue<TeaserJobData>(TEASER_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
