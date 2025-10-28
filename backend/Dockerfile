# Dev-friendly Dockerfile for NestJS backend
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the source
COPY . .

# Expose API port
EXPOSE 5000

# Run in watch mode for local development
CMD ["npm", "run", "start:dev"]
