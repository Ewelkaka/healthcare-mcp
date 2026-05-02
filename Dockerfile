FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY dist/ ./dist/

EXPOSE 8080

ENV PORT=8080
ENV TRANSPORT=http

CMD ["bun", "dist/server.js"]
