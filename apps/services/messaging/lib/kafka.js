// Shared Kafka utility - graceful when Kafka unavailable
import { Kafka, logLevel } from 'kafkajs'

const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092'
console.log(`[Kafka] Initializing with broker: ${kafkaBroker}`)
const kafka = new Kafka({
    clientId: process.env.SERVICE_NAME || 'messaging-service',
    brokers: [kafkaBroker],
    logLevel: logLevel.ERROR,
    retry: {
        retries: 5,
        initialRetryTime: 300,
    }
})

// Kafka Producer
export class KafkaProducer {
    constructor() {
        this.producer = kafka.producer()
        this.isConnected = false
        this.isDisabled = false
    }

    async connect() {
        if (this.isDisabled || this.isConnected) return
        try {
            await this.producer.connect()
            this.isConnected = true
            console.log('✅ Kafka Producer connected')
        } catch (err) {
            console.warn('⚠️ Kafka unavailable. Events disabled. Run Kafka or set KAFKA_BROKER.')
            this.isDisabled = true
        }
    }

    async send(topic, message) {
        if (this.isDisabled) return
        try {
            await this.connect()
            if (this.isDisabled) return
            const event = {
                eventType: topic,
                timestamp: new Date().toISOString(),
                data: message
            }
            await this.producer.send({
                topic,
                messages: [{ key: message.userId || message.id, value: JSON.stringify(event) }]
            })
            console.log(`📤 Event sent: ${topic}`, message)
        } catch (err) {
            if (err?.name === 'KafkaJSConnectionError' || err?.name === 'KafkaJSNonRetriableError') {
                this.isDisabled = true
                this.isConnected = false
            }
        }
    }

    async disconnect() {
        if (this.isConnected) {
            await this.producer.disconnect()
            this.isConnected = false
        }
    }
}

// Kafka Consumer
export class KafkaConsumer {
    constructor(groupId, topics) {
        this.consumer = kafka.consumer({
            groupId,
            sessionTimeout: 30000,
            heartbeatInterval: 3000
        })
        this.topics = Array.isArray(topics) ? topics : [topics]
        this.handlers = {}
        this.isRunning = false
    }

    on(eventType, handler) {
        this.handlers[eventType] = handler
    }

    async start() {
        if (this.isRunning) return

        await this.consumer.connect()
        await this.consumer.subscribe({
            topics: this.topics,
            fromBeginning: false
        })

        console.log(`✅ Kafka Consumer subscribed to: ${this.topics.join(', ')}`)

        this.isRunning = true

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const event = JSON.parse(message.value.toString())
                    const handler = this.handlers[event.eventType]

                    if (handler) {
                        console.log(`📥 Event received: ${event.eventType}`)
                        await handler(event.data)
                    }
                } catch (error) {
                    console.error('❌ Kafka consumer error:', error)
                }
            }
        })
    }

    async stop() {
        if (this.isRunning) {
            await this.consumer.disconnect()
            this.isRunning = false
        }
    }
}

// Singleton producer instance
let producerInstance

export function getKafkaProducer() {
    if (!producerInstance) {
        producerInstance = new KafkaProducer()
    }
    return producerInstance
}
