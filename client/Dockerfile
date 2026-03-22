# Stage 1: build Angular app
FROM mcr.microsoft.com/devcontainers/javascript-node:20 AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# Stage 2: serve static files
FROM mcr.microsoft.com/devcontainers/javascript-node:20 AS runtime
WORKDIR /app

RUN npm install -g serve
COPY --from=build /app/dist ./dist

EXPOSE 80
CMD ["sh", "-c", "ROOT=dist/client/browser; if [ ! -d \"$ROOT\" ]; then ROOT=dist/client; fi; if [ ! -d \"$ROOT\" ]; then ROOT=dist; fi; mkdir -p \"$ROOT/assets\"; API_URL=${API_BASE_URL:-http://localhost:5000}; case \"$API_URL\" in http://*|https://*) ;; *) API_URL=\"https://$API_URL\" ;; esac; cat > \"$ROOT/assets/config.js\" <<EOF\nwindow.__env = { apiBaseUrl: '$API_URL' };\nEOF\nserve -s \"$ROOT\" -l 80"]
