#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js"
import { randomUUID } from "node:crypto"

const PORT = parseInt(process.env.PORT ?? "8080")
const app = createMcpExpressApp()

app.all("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  })

  const server = new McpServer({
    name: "healthcare-mcp",
    version: "1.0.0",
  })

  server.tool("get_patient_summary", "Get patient summary", {}, async () => {
    return {
      content: [{ type: "text", text: "Patient: John Doe, DOB: 1980-01-01, Conditions: Hypertension, Medications: Lisinopril" }],
    }
  })

  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Healthcare MCP server running on port ${PORT}/mcp`)
})
