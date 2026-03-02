# ==========================================
# STAGE 1: Base Configuration
# ==========================================
# We use Alpine Linux because it is incredibly small (around 5MB) and secure.
FROM node:20-alpine AS base
# libc6-compat is required for some Node/Next.js native modules to work on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Enable corepack so Docker understands 'pnpm' commands automatically
RUN corepack enable pnpm

# ==========================================
# STAGE 2: Install Dependencies (Deps)
# ==========================================
FROM base AS deps
WORKDIR /app
# We ONLY copy the package files first. 
# This is a senior-level caching trick. If you change a React component later, 
# Docker won't have to re-download all your node_modules. It skips this stage!
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ==========================================
# STAGE 3: Build the Application (Builder)
# ==========================================
FROM base AS builder
WORKDIR /app
# Bring over the downloaded dependencies from Stage 2
COPY --from=deps /app/node_modules ./node_modules
# Now copy the rest of your application code
COPY . .
# Disable Next.js telemetry to speed up the build process and save bandwidth
ENV NEXT_TELEMETRY_DISABLED 1
# Compile the TypeScript and generate the optimized standalone files
RUN pnpm run build

# ==========================================
# STAGE 4: Production Environment (Runner)
# ==========================================
# This stage is the ONLY one that makes it into the final container. 
# Everything else is thrown away to save space.
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# SECURITY BEST PRACTICE: Never run a container as the 'root' user.
# We create a dedicated, restricted system user named 'nextjs'.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set up the folder Next.js needs for caching and give our new user ownership
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy ONLY the essential files needed to run the app. 
# We explicitly leave the massive node_modules folder behind.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch from the root user to our secure 'nextjs' user
USER nextjs

# Expose the port the app will run on
EXPOSE 3000
ENV PORT 3000
# Ensure it binds to all network interfaces so it can be accessed outside the container
ENV HOSTNAME "0.0.0.0"

# Start the Node server (Next.js automatically generated this in the standalone build)
CMD ["node", "server.js"]