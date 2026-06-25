FROM oven/bun:1.3.14-alpine

WORKDIR /app

# Install dependencies first for layer caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# App source
COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# The backend runs TypeScript directly via Bun (no build step needed)
CMD ["bun", "server/index.ts"]
