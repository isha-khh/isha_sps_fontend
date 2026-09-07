# Build Stage
FROM node:24-slim AS builder

# Node 20+ enables io_uring by default on Linux, which crashes (SIGSEGV) under QEMU
# user-mode emulation when cross-building linux/arm64 on an amd64 runner. Vite's
# Rolldown bundler is I/O heavy enough to hit it reliably, so disable it for the build.
ENV UV_USE_IO_URING=0

# corepack is the modern way to enable pnpm in Node images
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app

# Copy lockfile first to leverage Docker caching
COPY pnpm-lock.yaml package.json ./

RUN pnpm install --frozen-lockfile

COPY . .
ARG APP_VERSION=0.0.0
ENV VITE_APP_VERSION=$APP_VERSION
RUN pnpm run build

# Production Stage (Using Nginx for better performance)
FROM nginx:stable-alpine

# Copy the build output to Nginx's html folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: Copy a custom nginx config if you have SPA routing
# 將自定義配置複製進去
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
