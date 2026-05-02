import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { extractFhirContext } from "./fhir-context.js"
import { getPatientSummary, getMedications, getLabResults, getConditions, toolDefinitions } from "./tools/healthcare.js"
import type { FhirContext } from "./fhir-context.js"

const server = new Server(
  { name: "healthcare-mcp", version: "1.0.0" },
  {
    capabilities: {
      tools: {},
      extensions: {
        "ai.promptopinion/fhir-context": {
          scopes: [
            { name: "patient/Patient.rs", required: true },
            { name: "patient/Condition.rs" },
            { name: "patient/MedicationRequest.rs" },
            { name: "patient/Observation.rs" },
          ],
        },
      },
    },
  }
)

let currentContext: FhirContext | null = null

server.setRequestHandler(InitializeRequestSchema, async (request) => {
  return {
    protocolVersion: request.params.protocolVersion,
    capabilities: {
      tools: {},
      extensions: {
        "ai.promptopinion/fhir-context": {
          scopes: [
            { name: "patient/Patient.rs", required: true },
            { name: "patient/Condition.rs" },
            { name: "patient/MedicationRequest.rs" },
            { name: "patient/Observation.rs" },
          ],
        },
      },
    },
    serverInfo: { name: "healthcare-mcp", version: "1.0.0" },
  }
})

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolDefinitions.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: { type: "object", properties: {}, required: [] },
  })),
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const headers: Record<string, string | undefined> = {}
  const raw = (request.params as { _meta?: { headers?: Record<string, string> } })._meta?.headers
  if (raw) {
    Object.entries(raw).forEach(([k, v]) => {
      headers[k.toLowerCase()] = v
    })
  }
  currentContext = extractFhirContext(headers)

  if (!currentContext) {
    return {
      content: [{ type: "text" as const, text: "FHIR context not provided. Please configure X-FHIR-Server-URL header." }],
      isError: true,
    }
  }

  const { name } = request.params

  if (name === "get_patient_summary") return getPatientSummary(currentContext)()
  if (name === "get_medications") return getMedications(currentContext)()
  if (name === "get_lab_results") return getLabResults(currentContext)()
  if (name === "get_conditions") return getConditions(currentContext)()

  return {
    content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
    isError: true,
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
