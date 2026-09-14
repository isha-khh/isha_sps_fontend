# ==============================================
# SPS Frontend (Next.js) Dockerfile
# ==============================================

# Build Stage
FROM node:24-alpine AS builder

# See SPS.AdminWeb/Dockerfile: avoids io_uring-related SIGSEGV under QEMU when
# cross-building linux/arm64 (Next.js's native SWC binary is similarly I/O heavy).
ENV UV_USE_IO_URING=0

WORKDIR /app

# 安裝 pnpm（版本對齊 package.json 的 packageManager 欄位）
RUN npm install -g pnpm@11.24.0

# 複製 package files（也要帶 pnpm-workspace.yaml——pnpm 11 的
# allowBuilds 設定放在這支檔案裡，不是 package.json，沒帶到的話
# unrs-resolver 這個原生依賴的 postinstall script 會被 pnpm 的新版
# 供應鏈安全機制擋下來，pnpm install 直接失敗）
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

# 安裝依賴
RUN pnpm install --frozen-lockfile

# 複製原始碼
COPY . .

# 設定環境變數
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG BASE_PATH=/sps
ENV NEXT_PUBLIC_BASE_PATH=$BASE_PATH
ARG APP_VERSION=0.0.0
ENV NEXT_PUBLIC_APP_VERSION=$APP_VERSION

# 建置
RUN pnpm build

# ==============================================
# Production Stage
# ==============================================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 安裝 curl 用於 healthcheck
RUN apk add --no-cache curl

# 建立非 root 使用者
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 複製建置產物 (補上 chown 確保權限正確)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
