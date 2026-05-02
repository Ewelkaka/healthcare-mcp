import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js"
import { z } from "zod"
import { extractFhirContext } from "./fhir-context.js"
import { getPatientSummary, getMedications, getLabResults, getConditions } from "./tools/healthcare.js"
import type { FhirContext } from "./fhir-context.js"

const app = createMcpExpressApp()

app.use((req, _res, next) => {
  const headers = req.headers as Record<string, string | undefined>
  currentContext = extractFhirContext(headers)
  next()
})

let currentContext: FhirContext | null = null

app.all("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
  })

  const server = getServer()
  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

function getServer() {
  const server = new McpServer({
    name: "healthcare-mcp",
    version: "1.0.0",
  })

  server.tool("get_patient_summary", "Get patient summary", {}, async () => {
    if (!currentContext) return { content: [{ type: "text" as const, text: "No FHIR context" }], isError: true }
    return getPatientSummary(currentContext)()
  })

  server.tool("get_medications", "Get medications", {}, async () => {
    if (!currentContext) return { content: [{ type: "text" as const, text: "No FHIR context" }], isError: true }
    return getMedications(currentContext)()
  })

  server.tool("get_lab_results", "Get lab results", {}, async () => {
    if (!currentContext) return { content: [{ type: "text" as const, text: "No FHIR context" }], isError: true }
    return getLabResults(currentContext)()
  })

  server.tool("get_conditions", "Get conditions", {}, async () => {
    if (!currentContext) return { content: [{ type: "text" as const, text: "No FHIR context" }], isError: true }
    return getConditions(currentContext)()
  })

  return server
}

const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => {
  console.log(`Healthcare MCP server (stateless HTTP) running on http://localhost:${PORT}/mcp`)
})
