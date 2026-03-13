# X-Clone Infrastructure Services

## New Services Added

### 1. Zookeeper
- **Port**: 2181
- **Purpose**: Kafka coordination
- **Memory**: 512MB

### 2. Kafka
- **Ports**: 9092 (internal), 9093 (external)
- **Purpose**: Event streaming platform
- **Memory**: 1GB
- **Topics**: Auto-created

### 3. Redis
- **Port**: 6379
- **Purpose**: Caching, rate limiting, session storage
- **Memory**: 256MB
- **Password**: xclone_redis_password

### 4. Elasticsearch
- **Ports**: 9200 (HTTP), 9300 (Transport)
- **Purpose**: Full-text search, analytics
- **Memory**: 1GB

### 5. Kafka UI (Optional)
- **Port**: 8080
- **Purpose**: Monitor Kafka topics, messages
- **Access**: http://localhost:8080

## Connection Strings

```bash
# Kafka
KAFKA_BROKER=kafka:9092
KAFKA_BROKER_EXTERNAL=localhost:9093

# Redis
REDIS_URL=redis://:xclone_redis_password@redis:6379

# Elasticsearch
ELASTICSEARCH_URL=http://elasticsearch:9200
```

## Starting Services

```bash
# Start all services
docker-compose up -d

# Start only infrastructure
docker-compose up -d zookeeper kafka redis elasticsearch

# Check status
docker-compose ps

# View logs
docker-compose logs -f kafka
docker-compose logs -f redis
docker-compose logs -f elasticsearch
```

## Health Checks

```bash
# Kafka
docker exec xclone-kafka kafka-topics --list --bootstrap-server localhost:9092

# Redis
docker exec xclone-redis redis-cli -a xclone_redis_password ping

# Elasticsearch
curl http://localhost:9200/_cluster/health
```

## Creating Kafka Topics

```bash
# Create topics manually (optional - auto-create is enabled)
docker exec xclone-kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic USER_CREATED \
  --partitions 3 \
  --replication-factor 1

docker exec xclone-kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic POST_CREATED \
  --partitions 3 \
  --replication-factor 1

docker exec xclone-kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic POST_LIKED \
  --partitions 3 \
  --replication-factor 1

docker exec xclone-kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic FOLLOW_CREATED \
  --partitions 3 \
  --replication-factor 1
```

## Resource Usage

Total additional memory: ~3GB
- Zookeeper: 512MB
- Kafka: 1GB
- Redis: 256MB
- Elasticsearch: 1GB
- Kafka UI: 256MB

## Next Steps

1. Start infrastructure: `docker-compose up -d zookeeper kafka redis elasticsearch`
2. Verify health checks
3. Create Timeline Service
4. Add Kafka producers to existing services
