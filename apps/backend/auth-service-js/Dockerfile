FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN apk add --no-cache openssl

COPY . .

RUN npx prisma generate

# Expose the specific port
EXPOSE 3001

# Use dev command for development workflow
CMD ["sh", "-c", "npx prisma generate && npm run dev"]
