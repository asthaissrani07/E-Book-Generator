import { Kafka } from 'kafkajs';
import {
  getBlogPdfCompletedTopic,
  getBlogPdfFailedTopic,
  getBlogPdfTopic,
  getKafkaBrokers,
  getKafkaClientId,
} from './config';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function ensureKafkaTopics(): Promise<void> {
  const kafka = new Kafka({
    clientId: getKafkaClientId(),
    brokers: getKafkaBrokers(),
  });

  const admin = kafka.admin();
  await admin.connect();

  try {
    const required = [
      getBlogPdfTopic(),
      getBlogPdfCompletedTopic(),
      getBlogPdfFailedTopic(),
    ];

    const existing = await admin.listTopics();
    const missing = required.filter((topic) => !existing.includes(topic));

    if (missing.length > 0) {
      const created = await admin.createTopics({
        topics: missing.map((topic) => ({
          topic,
          numPartitions: 1,
          replicationFactor: 1,
        })),
        waitForLeaders: true,
        timeout: 60_000,
      });

      if (!created) {
        console.log('[kafka] Topics may already exist (createTopics returned false)');
      } else {
        console.log(`[kafka] Created topics: ${missing.join(', ')}`);
      }
    } else {
      console.log('[kafka] Required topics already exist');
    }

    // Brief pause so metadata propagates after leader election.
    await delay(1500);
  } finally {
    await admin.disconnect();
  }
}

export async function ensureKafkaTopicsWithRetry(maxAttempts = 5): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await ensureKafkaTopics();
      return;
    } catch (err) {
      lastError = err;
      const waitMs = attempt * 2000;
      console.warn(
        `[kafka] Topic setup attempt ${attempt}/${maxAttempts} failed, retrying in ${waitMs}ms…`,
        err instanceof Error ? err.message : err
      );
      await delay(waitMs);
    }
  }

  throw lastError;
}
