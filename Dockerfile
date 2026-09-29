FROM node:24-bookworm-slim

WORKDIR /app

RUN npm install -g pnpm@10.17.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @reachinbox/api exec prisma generate

RUN pnpm --filter @reachinbox/api build

CMD ["pnpm", "--filter", "@reachinbox/api", "start:worker"]
