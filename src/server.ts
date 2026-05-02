#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js"
import { randomUUID } from "node:crypto"
import { extractFhirContext } from "./fhir-context.js"
import { getPatientSummary, getMedications, getLabResults, getConditions } from "./tools/healthcare.js"

const TRANSPORT = process.env.TRANSPORT ?? "stdio"

let currentContext = null

function getServer() {
  const server = new McpServer({
    name: "healthcare-mcp",
    version: "1.0.0",
  })

  server.tool("get_patient_summary", "Get patient summary", {}, async () => {
    if (!currentContext) return { content: [{ type: "text", text: "No FHIR context" }], isError: true }
    return getPatientSummary(currentContext)()
  })

  server.tool("get_medications", "Get medications", {}, async () => {
    if (!currentContext) return { content: [{ type: "text", text: "No FHIR context" }], isError: true }
    return getMedications(currentContext)()
  })

  server.tool("get_lab_results", "Get lab results", {}, async () => {
    if (!currentContext) return { content: [{ type: "text", text: "No FHIR context" }], isError: true }
    return getLabResults(currentContext)()
  })

  server.tool("get_conditions", "Get conditions", {}, async () => {
    if (!currentContext) return { content: [{ type: "text", text: "No FHIR context" }], isError: true }
    return getConditions(currentContext)()
  })

  return server
}

if (TRANSPORT === "http") {
  const app = createMcpExpressApp()

  app.use((req, _res, next) => {
    const headers = req.headers
    currentContext = extractFhirContext(headers)
    next()
  })

  const transports = new Map()

  app.all("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"]
    let transport = sessionId ? transports.get(sessionId) : null

    if (!transport) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      })
      const server = getServer()
      await server.connect(transport)
      transports.set(transport.sessionId, transport)
    }

    await transport.handleRequest(req, res, req.body)
  })

  const PORT = process.env.PORT ?? 3000
  app.listen(PORT, () => {
    console.log(`Healthcare MCP server (HTTP) running on http://localhost:${PORT}/mcp`)
  })
} else {
  const server = getServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}
