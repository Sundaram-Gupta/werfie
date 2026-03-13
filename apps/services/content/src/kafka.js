const { Kafka } = require('kafkajs');

// localhost:9093 = Kafka in Docker (host); kafka:9092 = inside Docker
const brokers = [(process.env.KAFKA_BROKER || 'localhost:9093')];
const kafka = new Kafka({
    clientId: 'content-service',
    brokers,
    retry: {
        retries: 5,
        initialRetryTime: 300,
    }
});

class KafkaProducer {
    constructor() {
        this.producer = kafka.producer();
        this.isConnected = false;
        this.isDisabled = false;
    }

    async connect() {
        if (this.isDisabled || this.isConnected) return;
        
        try {
            await this.producer.connect();
            this.isConnected = true;
            console.log('✅ Kafka Producer connected');
        } catch (error) {
            console.warn('⚠️ Kafka Producer failed to connect. Kafka events will be disabled for this session.');
            console.error('Kafka connection error:', error.message);
            this.isDisabled = true;
        }
    }

    async send(topic, message) {
        if (this.isDisabled) return;

        try {
            await this.connect();
            if (this.isDisabled) return;

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
            console.error(`❌ Failed to send event ${topic}:`, error.message);
            // If we hit a network error while sending, disable kafka to avoid repeated timeouts
            if (error.name === 'KafkaJSConnectionError' || error.name === 'KafkaJSRequestTimeoutError') {
                console.warn('⚠️ Kafka connection lost. Disabling Kafka events.');
                this.isDisabled = true;
                this.isConnected = false;
            }
        }
    }
}

module.exports = new KafkaProducer();
