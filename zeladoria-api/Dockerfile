FROM node:20-alpine

WORKDIR /app

# Copiar apenas package.json primeiro (cache de layers)
COPY package*.json ./

RUN npm ci --only=production

# Copiar código fonte
COPY src/ ./src/

# Usuário não-root para segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "src/server.js"]
