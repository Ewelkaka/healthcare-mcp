# Healthcare MCP Server

MCP (Model Context Protocol) server for healthcare data access via FHIR API. Built for the [Prompt Opinion Agents Assemble Challenge](https://www.promptopinion.ai/agents-assemble-challenge).

## Features

- **Patient Summary** - Get comprehensive patient overview (demographics, conditions, medications)
- **Medications** - List active medication requests with dosage instructions
- **Lab Results** - Retrieve recent laboratory observations
- **Conditions** - Browse patient conditions with clinical status

## Standards

- **FHIR R4** - HL7 Fast Healthcare Interoperability Resources
- **SHARP-on-MCP** - Standardized Healthcare Agent Remote Protocol
- **MCP** - Model Context Protocol by Anthropic

## FHIR Context Support

Implements `ai.promptopinion/fhir-context` extension:
- `X-FHIR-Server-URL` header - FHIR server endpoint
- `X-FHIR-Access-Token` header - SMART on FHIR access token
- `X-Patient-ID` header - Current patient identifier

Required scopes:
- `patient/Patient.rs` (required)
- `patient/Condition.rs`
- `patient/MedicationRequest.rs`
- `patient/Observation.rs`

## Installation

```bash
bun install
```

## Build

```bash
# Build stdio server (default)
bun build src/index.ts --outdir dist --target bun

# Build HTTP server (Streamable HTTP)
bun build src/http-server.ts --outdir dist --target bun
```

## Usage

### Option 1: Stdio Server (Local)

```bash
bun dist/index.js
```

Test with:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | bun dist/index.js
```

### Option 2: HTTP Server (Remote / Prompt Opinion)

```bash
TRANSPORT=http PORT=8080 bun dist/server.js
```

Server will be available at `http://your-host:8080/mcp`

## Deployment

### Deploy to Render (Recommended - Free Tier)

1. Push code to GitHub/GitLab
2. Create new Web Service on [Render.com](https://render.com)
3. Connect repository: `yourname/healthcare-mcp`
4. Settings:
   - **Runtime**: Docker
   - **Environment Variables**:
     - `TRANSPORT` = `http`
     - `PORT` = `8080`
5. Deploy - server will be available at `https://your-app.onrender.com/mcp`

Or use the `render.yaml` file for Infrastructure as Code.

### Deploy to Fly.io

```bash
# Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
fly launch --dockerfile Dockerfile
fly deploy
```

### Deploy to Railway

```bash
# Install Railway CLI: https://docs.railway.app/develop/cli
railway login
railway init
railway up
```

### With Prompt Opinion

1. Deploy the HTTP server to a public URL (e.g., Render, Fly.io, Railway)
2. Add MCP server in Prompt Opinion: `Configuration -> MCP Servers`
3. Enter your server URL: `https://your-server.com/mcp`
4. Enable FHIR context extension when prompted
5. Authorize requested scopes

### Test Your Deployment

```bash
# Test if server is running
curl -X POST https://your-server.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```

## Tools

| Tool | Description |
|------|-------------|
| `get_patient_summary` | Complete patient overview |
| `get_medications` | Active medications list |
| `get_lab_results` | Recent lab results |
| `get_conditions` | Patient conditions |

## Example FHIR Server

For testing, you can use:
- [HAPI FHIR Server](https://hapi.fhir.org/)
- [SMART Health IT Sandbox](https://launch.smarthealthit.org/)

## Tech Stack

- TypeScript
- Bun runtime
- @modelcontextprotocol/sdk
- Zod validation

## Project Structure

```
healthcare-mcp/
├── src/
│   ├── index.ts          # Stdio server (local)
│   ├── http-server.ts   # HTTP server (remote)
│   ├── fhir-context.ts  # FHIR context extraction
│   └── tools/
│       └── healthcare.ts # MCP tool implementations
├── dist/                # Build output
├── package.json
└── tsconfig.json
```

## Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector bun dist/index.js
```

## License

MIT
