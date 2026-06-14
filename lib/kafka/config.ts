export function getKafkaBrokers(): string[] {
  return (process.env.KAFKA_BROKERS || '127.0.0.1:9092')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);
}

export function getKafkaClientId(): string {
  return process.env.KAFKA_CLIENT_ID || 'ebook-generator';
}

export function getKafkaConsumerGroupId(): string {
  return process.env.KAFKA_GROUP_ID || 'ebook-generator-blog-consumers';
}

export function getBlogPdfTopic(): string {
  return process.env.KAFKA_TOPIC_BLOG_PDF || 'blog_service.pdf.generate';
}

export function getBlogPdfCompletedTopic(): string {
  return process.env.KAFKA_TOPIC_BLOG_PDF_COMPLETED || 'blog_service.pdf.completed';
}

export function getBlogPdfFailedTopic(): string {
  return process.env.KAFKA_TOPIC_BLOG_PDF_FAILED || 'blog_service.pdf.failed';
}
