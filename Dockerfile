# -------------------------------------------------------------
# Stage 1: Build
# -------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Install deps first (better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build Astro (SSR output: dist/server/entry.mjs)
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Runtime
# -------------------------------------------------------------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

WORKDIR /app

# Only copy what we need to run
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
