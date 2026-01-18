FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3004

# Start command (Runs both Next.js server and Worker)
# In production, these might be separate containers, but for dev we run locally
CMD ["sh", "-c", "node worker.js & npm start"]
