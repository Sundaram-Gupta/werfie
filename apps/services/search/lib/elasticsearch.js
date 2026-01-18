import { Client } from '@elastic/elasticsearch'

let esClient

export function getElasticClient() {
    if (!esClient) {
        esClient = new Client({
            node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
            maxRetries: 5,
            requestTimeout: 60000
        })

        // Check connection
        esClient.ping()
            .then(() => console.log('✅ Connected to Elasticsearch'))
            .catch(err => console.error('❌ Elasticsearch connection error:', err))
    }
    return esClient
}

export async function createIndices() {
    const client = getElasticClient()

    // Post Index
    if (!await client.indices.exists({ index: 'posts' })) {
        await client.indices.create({
            index: 'posts',
            body: {
                mappings: {
                    properties: {
                        content: { type: 'text' },
                        userId: { type: 'keyword' },
                        createdAt: { type: 'date' },
                        hashtags: { type: 'keyword' }
                    }
                }
            }
        })
        console.log('✅ Created "posts" index')
    }

    // User Index
    if (!await client.indices.exists({ index: 'users' })) {
        await client.indices.create({
            index: 'users',
            body: {
                mappings: {
                    properties: {
                        name: { type: 'text' },
                        handle: { type: 'text' }, // Analyzed for partial matching
                        id: { type: 'keyword' }
                    }
                }
            }
        })
        console.log('✅ Created "users" index')
    }
}
