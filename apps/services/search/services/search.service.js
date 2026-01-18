import { getElasticClient } from '../lib/elasticsearch.js'

export class SearchService {
    static async indexPost(post) {
        const client = getElasticClient()

        // Extract hashtags
        const hashtags = (post.content.match(/#[a-z0-9_]+/gi) || []).map(t => t.slice(1).toLowerCase())

        await client.index({
            index: 'posts',
            id: post.id,
            document: {
                id: post.id,
                content: post.content,
                userId: post.userId,
                createdAt: post.createdAt,
                hashtags
            }
        })
        console.log(`✅ Indexed post ${post.id}`)
    }

    static async searchPosts(query, limit = 20) {
        const client = getElasticClient()
        const result = await client.search({
            index: 'posts',
            body: {
                query: {
                    multi_match: {
                        query,
                        fields: ['content', 'hashtags'],
                        fuzziness: 'AUTO'
                    }
                },
                size: limit,
                sort: [{ _score: 'desc' }, { createdAt: 'desc' }]
            }
        })

        return result.hits.hits.map(hit => hit._source)
    }

    static async getTrendingHashtags() {
        const client = getElasticClient()
        // Need a proper aggregation query
        // Simplified for now
        return []
    }
}
