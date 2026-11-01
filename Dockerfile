# Cloud Run container for the Express + Vite application.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY scripts ./scripts
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run lint && npm test && npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
COPY scripts ./scripts
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/server.local.ts ./server.local.ts
COPY --from=build /app/src ./src
EXPOSE 8080
CMD ["node", "--import", "tsx", "server.local.ts"]
