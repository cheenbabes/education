FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js (NEXT_PUBLIC_ vars must be set at build time)
ARG NEXT_PUBLIC_KG_SERVICE_URL
ENV NEXT_PUBLIC_KG_SERVICE_URL=$NEXT_PUBLIC_KG_SERVICE_URL

RUN npm run build

# Production image
FROM node:22-slim
WORKDIR /app

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma files for migrations
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
