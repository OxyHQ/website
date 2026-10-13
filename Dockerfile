# The digest is what the build uses; the tag is for readers and for
# scripts/check-bun-pin.mjs. A tag can be re-pushed, a digest cannot, so a base
# image bump needs a new digest (the multi-arch index, which lists linux/arm64)
# and a re-review: `python3 .github/scripts/reviewed-image.py pin`.
FROM oven/bun:1.4.3-alpine@sha256:629e17411f1f129dbec3af78d5af9c9f2a937435c80349437206c6b0b7422373

WORKDIR /app

# Install dependencies first for layer caching.
# `--production` skips devDependencies (vite, playwright, sharp, satori,
# typedoc, drizzle-kit, biome, eslint): the frontend is built in CI and shipped
# to Cloudflare Pages, and this image only runs `server/`. `dependencies` still
# serves both halves, so the frontend's runtime packages (react, three, wagmi,
# and Expo through @oxy.so/services and @oxy.so/bloom, which brings typescript
# and @babel/core back in) are installed here too, unused by the server.
# `--ignore-scripts` runs no dependency lifecycle script. Measured on this
# lockfile: the only install-time script in the production closure is
# vue-demi's postinstall (pulled in by the frontend's @floating-ui/vue), and the
# tree it leaves is byte-identical with and without it. A server dependency
# that needs its install script fails CI's image smoke, which boots this image.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts

# App source
COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Run as the base image's unprivileged `bun` user (uid 1000). The app and its
# node_modules stay owned by root (no `--chown`), so the process can read them
# but not change them; the server writes nothing to disk (uploads are buffered
# in memory), and /tmp and the user's home stay writable for Bun itself. CI's
# image smoke asserts all of this on every pull request that touches the image.
USER bun

# The backend runs TypeScript directly via Bun (no build step needed)
CMD ["bun", "server/index.ts"]
