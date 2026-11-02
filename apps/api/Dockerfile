FROM node:26.13.0-alpine AS base
WORKDIR /repo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm install -g "pnpm@$(node -p "require('./package.json').packageManager.split('@')[1]")"

FROM base AS build
RUN pnpm install --frozen-lockfile --filter api...
COPY apps/api apps/api
RUN pnpm --filter api build

FROM base AS prod-deps
RUN pnpm install --frozen-lockfile --prod --filter api...

FROM node:26.13.0-alpine
RUN apk upgrade --no-cache && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
ENV NODE_ENV=production PORT=3000
WORKDIR /repo/apps/api
COPY --from=prod-deps /repo/node_modules /repo/node_modules
COPY --from=prod-deps /repo/apps/api/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY apps/api/prisma ./prisma
COPY apps/api/prisma.config.ts ./
USER node
# Aplica el schema (db push se niega a hacer cambios con pérdida de datos) y arranca.
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push && exec node dist/src/main.js"]
