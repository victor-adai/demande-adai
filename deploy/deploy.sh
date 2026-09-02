#!/bin/bash
set -e

cd /var/www/demande-adai

echo ">> git pull"
git fetch origin main
git reset --hard origin/main

echo ">> install dependencies"
npx --yes pnpm@10.33.0 install --frozen-lockfile

echo ">> prisma migrate deploy"
npx --yes pnpm@10.33.0 exec prisma migrate deploy

echo ">> prisma generate"
npx --yes pnpm@10.33.0 exec prisma generate

echo ">> db seed (idempotent — only fills in what's missing, never overwrites admin edits)"
npx --yes pnpm@10.33.0 run db:seed

echo ">> build"
npx --yes pnpm@10.33.0 run build

echo ">> restart pm2"
pm2 restart demande-adai

echo ">> deploy done"
