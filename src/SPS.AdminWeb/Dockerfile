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

# nginx 官方映像啟動時會把 /etc/nginx/templates/*.template 內的 ${變數} 換成環境變數後寫到 conf.d/，
# 所以後端位址可以在部署時用 API_UPSTREAM 指定，不用為了換位址重新打包。
# NGINX_ENVSUBST_FILTER 限制只替換名稱含 API_ 的變數，避免誤動 nginx 自己的 $host、$uri 等變數。
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=http://172.17.0.4:8080 \
    NGINX_ENVSUBST_FILTER=API_

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
