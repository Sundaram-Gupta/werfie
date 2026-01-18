const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'content-service',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
    retry: {
        retries: 5,
        initialRetryTime: 300,
    }
});

class KafkaProducer {
    constructor() {
        this.producer = kafka.producer();
        this.isConnected = false;
    }

    async connect() {
        if (!this.isConnected) {
            await this.producer.connect();
            this.isConnected = true;
            console.log('✅ Kafka Producer connected');
        }
    }

    async send(topic, message) {
        try {
            await this.connect();

            const event = {
                eventType: topic,
                timestamp: new Date().toISOString(),
                data: message
            };

            await this.producer.send({
                topic,
                messages: [{
                    value: JSON.stringify(event)
                }]
            });

            console.log(`📤 Event sent: ${topic}`);
        } catch (error) {
            console.error(`❌ Failed to send event ${topic}:`, error);
        }
    }
}

module.exports = new KafkaProducer();
