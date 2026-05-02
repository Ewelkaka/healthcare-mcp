FROM oven/bun:latest

WORKDIR /app

COPY package.json ./
RUN bun install --no-lockfile

COPY dist/ ./dist/

EXPOSE 8080

ENV PORT=8080
ENV TRANSPORT=http

RUN ls -la dist/

CMD ["/usr/local/bin/bun", "dist/server.js"]
