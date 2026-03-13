FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3006

CMD ["sh", "-c", "node worker.js & npm start"]
