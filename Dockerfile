# 使用 Node.js 20 Alpine 基礎映像
FROM node:20-alpine

# 設定工作目錄
WORKDIR /app

# 安裝 pnpm
RUN npm install -g pnpm@10.4.1

# 複製 package 檔案
COPY package.json pnpm-lock.yaml* ./

# 複製 patches 目錄 (如果存在)
COPY patches ./patches 2>/dev/null || true

# 安裝所有依賴 (包括開發依賴,因為建置需要)
RUN pnpm install --frozen-lockfile

# 複製所有原始碼
COPY . .

# 建置應用程式
RUN pnpm run build

# 暴露 port 8080
EXPOSE 8080

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=8080

# 啟動應用程式
CMD ["pnpm", "start"]
