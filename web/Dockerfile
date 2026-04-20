FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci

# Build the Vue app
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner

# Copy Vite build output to Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
