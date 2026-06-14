import '../lib/utils/bootstrapEnv';

import { Kafka, type Consumer } from 'kafkajs';
import {
  getBlogPdfTopic,
  getKafkaBrokers,
  getKafkaClientId,
  getKafkaConsumerGroupId,
} from '../lib/kafka/config';
import { ensureKafkaTopicsWithRetry } from '../lib/kafka/ensureTopics';
import { handleBlogPdfEvent } from '../lib/kafka/handleBlogPdfEvent';
import { disconnectKafkaProducer } from '../lib/kafka/producer';
import { isBlogPdfGenerateEvent } from '../lib/kafka/types';

let consumer: Consumer | null = null;
let shuttingDown = false;

async function startConsumer(): Promise<void> {
  await ensureKafkaTopicsWithRetry();

  const kafka = new Kafka({
    clientId: getKafkaClientId(),
    brokers: getKafkaBrokers(),
  });

  consumer = kafka.consumer({ groupId: getKafkaConsumerGroupId() });
  await consumer.connect();

  const topic = getBlogPdfTopic();
  await consumer.subscribe({ topic, fromBeginning: false });

  console.log(`[kafka-blog] Listening on topic "${topic}"`);
  console.log(`[kafka-blog] Brokers: ${getKafkaBrokers().join(', ')}`);
  console.log(`[kafka-blog] Group: ${getKafkaConsumerGroupId()}`);

  await consumer.run({
    eachMessage: async ({ topic: msgTopic, partition, message }) => {
      if (shuttingDown || !message.value) return;

      const raw = message.value.toString();
      let parsed: unknown;

      try {
        parsed = JSON.parse(raw);
      } catch {
        console.error(`[kafka-blog] Invalid JSON on ${msgTopic}[${partition}]:`, raw.slice(0, 200));
        return;
      }

      if (!isBlogPdfGenerateEvent(parsed)) {
        console.warn(`[kafka-blog] Ignoring unknown event:`, raw.slice(0, 200));
        return;
      }

      console.log(`[kafka-blog] Received event ${parsed.eventId} for blog ${parsed.blogId}`);

      try {
        await handleBlogPdfEvent(parsed);
      } catch (err) {
        console.error(
          `[kafka-blog] Failed event ${parsed.eventId}:`,
          err instanceof Error ? err.message : err
        );
      }
    },
  });
}

async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('[kafka-blog] Shutting down…');
  await consumer?.disconnect().catch(() => {});
  await disconnectKafkaProducer().catch(() => {});
}

process.on('SIGINT', () => {
  shutdown().finally(() => process.exit(0));
});
process.on('SIGTERM', () => {
  shutdown().finally(() => process.exit(0));
});

startConsumer().catch((err) => {
  console.error('[kafka-blog] Fatal:', err);
  process.exit(1);
});
