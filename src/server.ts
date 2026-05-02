#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import express from "express"

const PORT = parseInt(process.env.PORT ?? "8080")
const app = express()

app.use(express.json())

app.all("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
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

  server.tool("get_medications", "Get medications", {}, async () => {
    return {
      content: [{ type: "text", text: "Medications: Lisinopril 10mg daily, Metformin 500mg twice daily" }],
    }
  })

  server.tool("get_lab_results", "Get lab results", {}, async () => {
    return {
      content: [{ type: "text", text: "Recent labs: HbA1c 7.2%, Cholesterol 190 mg/dL, LDL 110 mg/dL" }],
    }
  })

  server.tool("get_conditions", "Get conditions", {}, async () => {
    return {
      content: [{ type: "text", text: "Active conditions: Hypertension (essential), Type 2 Diabetes, Hyperlipidemia" }],
    }
  })

  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Healthcare MCP server running on port ${PORT}/mcp`)
})
