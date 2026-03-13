import { Client } from '@elastic/elasticsearch'

let esClient = null
let esFailed = false

export function getElasticClient() {
    if (esFailed) return null
    if (esClient) return esClient
    try {
        esClient = new Client({
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
            maxRetries: 0,
            requestTimeout: 3000
        })
    } catch (e) {
        console.warn('Elasticsearch init failed:', e?.message)
        esFailed = true
        return null
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
