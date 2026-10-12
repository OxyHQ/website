# The digest is what the build uses; the tag is for readers and for
# scripts/check-bun-pin.mjs. A tag can be re-pushed, a digest cannot, so a base
# image bump needs a new digest (the multi-arch index, which lists linux/arm64)
# and a re-review: `python3 .github/scripts/reviewed-image.py pin`.
FROM oven/bun:1.4.3-alpine@sha256:629e17411f1f129dbec3af78d5af9c9f2a937435c80349437206c6b0b7422373

WORKDIR /app

# Install dependencies first for layer caching.
# `--production` skips devDependencies: this image only runs `server/`, whose
# every external import is a runtime `dependency` (the frontend build — vite,
# playwright, three, sharp, satori, typedoc — happens in CI, not here).
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# App source
COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Run as the base image's unprivileged `bun` user (uid 1000). The app and its
# node_modules stay owned by root, so the process can read them but not change
# them; the server writes nothing to disk (uploads are buffered in memory).
USER bun

# The backend runs TypeScript directly via Bun (no build step needed)
CMD ["bun", "server/index.ts"]
