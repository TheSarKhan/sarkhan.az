FROM node:22-alpine

WORKDIR /app

# Copy shared identity and wallet assets/templates
COPY shared ./shared
COPY wallet ./wallet

# Install backend production dependencies
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/src ./src

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3015

EXPOSE 3015

CMD ["node", "src/server.js"]
