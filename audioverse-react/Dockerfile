# frontend/Dockerfile
# Build context must be the REPO ROOT (.) so that honest-living source is available.
FROM node:22-alpine AS build
WORKDIR /app
COPY audioverse-react/package*.json ./
RUN npm ci
# Copy all app sources
COPY audioverse-react/ .
# Copy production env file for Vite
COPY audioverse-react/.env.production .env.production
# Only copy the honest-living packages actually used by audioverse-react
COPY honest-living/packages/shared/ /honest-living/packages/shared/
COPY honest-living/packages/game-engine/ /honest-living/packages/game-engine/
COPY honest-living/packages/client/ /honest-living/packages/client/
# Make node_modules resolvable from honest-living paths
RUN ln -s /app/node_modules /honest-living/node_modules
# Skip tsc type-checking in Docker build (honest-living has unresolved deps);
# Vite uses esbuild for transpilation and doesn't need tsc.
# Use .env.production for Vite build
ENV NODE_ENV=production
RUN cp .env.production .env && npx vite build

# Serve with nginx
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY audioverse-react/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
