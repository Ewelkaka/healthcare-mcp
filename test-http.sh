#!/bin/bash
# Test script for Healthcare MCP Server (HTTP mode)

echo "=== Healthcare MCP Server Test ==="
echo ""

# Check if dist/server.js exists
if [ ! -f "dist/server.js" ]; then
  echo "Building server..."
  ~/.bun/bin/bun build src/server.ts --outdir dist --target bun
fi

# Start server in background
echo "Starting server on port 8080..."
TRANSPORT=http PORT=8080 ~/.bun/bin/bun dist/server.js &
SERVER_PID=$!
sleep 2

# Test initialize request
echo "Testing initialize request..."
RESPONSE=$(curl -s -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}')

echo "Response: $RESPONSE"
echo ""

# Test with FHIR context
echo "Testing with FHIR context headers..."
RESPONSE2=$(curl -s -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-FHIR-Server-URL: https://hapi.fhir.org/baseR4" \
  -H "X-Patient-ID: example" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}')

echo "Response: $RESPONSE2"
echo ""

# Kill server
echo "Stopping server..."
kill $SERVER_PID 2>/dev/null
echo "Test completed."
