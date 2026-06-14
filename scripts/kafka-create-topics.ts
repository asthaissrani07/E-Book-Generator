import '../lib/utils/bootstrapEnv';

import { ensureKafkaTopicsWithRetry } from '../lib/kafka/ensureTopics';
import {
  getBlogPdfCompletedTopic,
  getBlogPdfFailedTopic,
  getBlogPdfTopic,
  getKafkaBrokers,
} from '../lib/kafka/config';

async function main() {
  await ensureKafkaTopicsWithRetry();
  console.log('[kafka] Ready. Topics:');
  console.log(`  - ${getBlogPdfTopic()}`);
  console.log(`  - ${getBlogPdfCompletedTopic()}`);
  console.log(`  - ${getBlogPdfFailedTopic()}`);
  console.log(`[kafka] Brokers: ${getKafkaBrokers().join(', ')}`);
}

main().catch((err) => {
  console.error('[kafka] Failed to create topics:', err);
  process.exit(1);
});
