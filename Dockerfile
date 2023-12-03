# ---- Stage 1: Build Angular App ----
FROM node:18 AS angular-build
WORKDIR /app
# Correcting the paths
COPY xevo-game/package.json xevo-game/package-lock.json ./
RUN npm install
# Correcting the paths
COPY xevo-game/ ./
RUN npm run build --prod

# ---- Stage 2: xevo-api ----
FROM node:18
WORKDIR /usr/src/app

# Correcting the paths
COPY xevo-api/package.json xevo-api/package-lock.json ./
RUN npm install

# Copy built Angular files from Stage 1
COPY --from=angular-build /app/dist/public ./public

# Correcting the paths for copying all source code
COPY xevo-api/ ./

# Expose API port
EXPOSE 6969

# Start xevo-api
CMD ["npm", "start"]