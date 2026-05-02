FROM oven/bun:latest

WORKDIR /app

COPY . .

RUN bun install

RUN bun build src/server.ts --outdir dist --target bun

EXPOSE 8080

ENV PORT=8080
ENV TRANSPORT=http

CMD ["bun", "dist/server.js"]
