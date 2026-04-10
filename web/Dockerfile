FROM node:22-slim AS builder
WORKDIR /app

# Install openssl so Prisma can detect the correct engine (3.0.x on Bookworm)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Use public npm registry with legacy peer deps for Clerk/Next compat
RUN printf "registry=https://registry.npmjs.org/\nlegacy-peer-deps=true\n" > .npmrc

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js — NEXT_PUBLIC_ vars must be available at build time
ARG NEXT_PUBLIC_KG_SERVICE_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
ARG NEXT_PUBLIC_CLERK_PLAN_HOMESTEAD
ARG NEXT_PUBLIC_CLERK_PLAN_SCHOOLHOUSE
ENV NEXT_PUBLIC_KG_SERVICE_URL=$NEXT_PUBLIC_KG_SERVICE_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
ENV NEXT_PUBLIC_CLERK_PLAN_HOMESTEAD=$NEXT_PUBLIC_CLERK_PLAN_HOMESTEAD
ENV NEXT_PUBLIC_CLERK_PLAN_SCHOOLHOUSE=$NEXT_PUBLIC_CLERK_PLAN_SCHOOLHOUSE

RUN npm run build

# Production image
FROM node:22-slim
WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy standalone Next.js build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma for runtime migrations
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma

# Copy curriculum data for runtime seeding
COPY --from=builder /app/prisma/all-curricula.json ./prisma/all-curricula.json

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# At startup: run migrations, seed data, then start server
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node prisma/seed-curricula.js; exec node server.js"]
