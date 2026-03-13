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
        try {
            const client = getElasticClient()
            if (!client) return []
            const result = await client.search({
                index: 'posts',
                query: {
                    multi_match: {
                        query,
                        fields: ['content', 'hashtags'],
                        fuzziness: 'AUTO'
                    }
                },
                size: limit,
                sort: [{ _score: 'desc' }, { createdAt: 'desc' }]
            })
            const hits = result.hits?.hits ?? []
            return hits.map(hit => hit._source ?? hit)
        } catch (err) {
            console.warn('Elasticsearch search failed, returning empty:', err?.message)
            return []
        }
    }

    static async getTrendingHashtags() {
        const client = getElasticClient()
        // Need a proper aggregation query
        // Simplified for now
        return []
    }
}
