import { Kafka, type Producer } from 'kafkajs';
import {
  getBlogPdfCompletedTopic,
  getBlogPdfFailedTopic,
  getKafkaBrokers,
  getKafkaClientId,
} from './config';
import type { BlogPdfCompletedEvent, BlogPdfFailedEvent } from './types';

let producer: Producer | null = null;

async function getProducer(): Promise<Producer> {
  if (!producer) {
    const kafka = new Kafka({
      clientId: getKafkaClientId(),
      brokers: getKafkaBrokers(),
    });
    producer = kafka.producer();
    await producer.connect();
  }
  return producer;
}

export async function publishBlogPdfCompleted(event: BlogPdfCompletedEvent): Promise<void> {
  const p = await getProducer();
  await p.send({
    topic: getBlogPdfCompletedTopic(),
    messages: [
      {
        key: event.blogId,
        value: JSON.stringify(event),
      },
    ],
  });
}

export async function publishBlogPdfFailed(event: BlogPdfFailedEvent): Promise<void> {
  const p = await getProducer();
  await p.send({
    topic: getBlogPdfFailedTopic(),
    messages: [
      {
        key: event.blogId,
        value: JSON.stringify(event),
      },
    ],
  });
}

export async function disconnectKafkaProducer(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
}
