// Generated from src/server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

const PORT = parseInt(process.env.PORT ?? "8080");
const app = express();
app.use(express.json());

// Store FHIR context per transport/session
const sessionContexts = new Map();

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok", service: "healthcare-mcp" });
});

app.all("/mcp", async (req, res) => {
  // Extract FHIR context from SHARP-on-MCP headers
  const fhirUrl = req.headers["x-fhir-server-url"];
  const fhirToken = req.headers["x-fhir-access-token"];
  const patientId = req.headers["x-patient-id"];

  if (!fhirUrl) {
    res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Missing X-FHIR-Server-URL header" },
      id: null,
    });
    return;
  }

  // Create transport with session
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  // Store context for this session
  const sessionId = transport.sessionId;
  sessionContexts.set(sessionId, { fhirUrl, fhirToken, patientId });

  const server = new McpServer({
    name: "healthcare-mcp",
    version: "1.0.0",
  });

  // Helper to fetch from FHIR
  async function fetchFhir(resourceType, params) {
    const ctx = sessionContexts.get(sessionId);
    const url = new URL(`${ctx.fhirUrl}/${resourceType}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const headers = {};
    if (ctx.fhirToken) headers["Authorization"] = `Bearer ${ctx.fhirToken}`;
    const response = await fetch(url.toString(), { headers });
    if (!response.ok) throw new Error(`FHIR ${resourceType}: ${response.status}`);
    return response.json();
  }

  // Register tools
  server.tool("get_patient_summary", "Get patient summary", {}, async () => {
    const ctx = sessionContexts.get(sessionId);
    if (!ctx?.patientId) return { content: [{ type: "text", text: "No patient ID" }], isError: true };

    try {
      const [patient, conditions, meds] = await Promise.all([
        fetchFhir(`Patient/${ctx.patientId}`),
        fetchFhir("Condition", { patient: ctx.patientId, "clinical-status": "active" }),
        fetchFhir("MedicationRequest", { patient: ctx.patientId, status: "active" }),
      ]);

      const name = patient.name?.[0];
      const fullName = `${name?.given?.join(" ") ?? ""} ${name?.family ?? ""}`.trim();

      const condList =
        (conditions.entry ?? [])
          .map((e) => e.resource.code?.text)
          .filter(Boolean)
          .join(", ") || "None";

      const medList =
        (meds.entry ?? [])
          .map((e) => e.resource.medicationCodeableConcept?.text)
          .filter(Boolean)
          .join(", ") || "None";

      return {
        content: [
          {
            type: "text",
            text: [
              `Patient: ${fullName || ctx.patientId}`,
              `DOB: ${patient.birthDate ?? "unknown"}, Gender: ${patient.gender ?? "unknown"}`,
              `Active Conditions: ${condList}`,
              `Active Medications: ${medList}`,
            ].join("\n"),
          },
        ],
      };
    } catch (error) {
      return { content: [{ type: "text", text: `FHIR error: ${error.message}` }], isError: true };
    }
  });

  server.tool("get_medications", "Get medications", {}, async () => {
    const ctx = sessionContexts.get(sessionId);
    if (!ctx?.patientId) return { content: [{ type: "text", text: "No patient ID" }], isError: true };

    try {
      const meds = await fetchFhir("MedicationRequest", { patient: ctx.patientId, status: "active" });
      const list =
        (meds.entry ?? [])
          .map((e) => `- ${e.resource.medicationCodeableConcept?.text ?? e.resource.id}`)
          .join("\n") || "No active medications";
      return { content: [{ type: "text", text: list }] };
    } catch (error) {
      return { content: [{ type: "text", text: `FHIR error: ${error.message}` }], isError: true };
    }
  });

  server.tool("get_lab_results", "Get lab results", {}, async () => {
    const ctx = sessionContexts.get(sessionId);
    if (!ctx?.patientId) return { content: [{ type: "text", text: "No patient ID" }], isError: true };

    try {
      const obs = await fetchFhir("Observation", { patient: ctx.patientId, category: "laboratory", _count: "20" });
      const list =
        (obs.entry ?? [])
          .map((e) => {
            const val = e.resource.valueQuantity
              ? `${e.resource.valueQuantity.value} ${e.resource.valueQuantity.unit ?? ""}`
              : "";
            return `- ${e.resource.code?.text ?? "Unknown"}: ${val}`;
          })
          .join("\n") || "No lab results";
      return { content: [{ type: "text", text: list }] };
    } catch (error) {
      return { content: [{ type: "text", text: `FHIR error: ${error.message}` }], isError: true };
    }
  });

  server.tool("get_conditions", "Get conditions", {}, async () => {
    const ctx = sessionContexts.get(sessionId);
    if (!ctx?.patientId) return { content: [{ type: "text", text: "No patient ID" }], isError: true };

    try {
      const conds = await fetchFhir("Condition", { patient: ctx.patientId });
      const list =
        (conds.entry ?? [])
          .map((e) => {
            const status = e.resource.clinicalStatus?.coding?.[0]?.code ?? "";
            return `- ${e.resource.code?.text ?? "Unknown"} [${status}]`;
          })
          .join("\n") || "No conditions";
      return { content: [{ type: "text", text: list }] };
    } catch (error) {
      return { content: [{ type: "text", text: `FHIR error: ${error.message}` }], isError: true };
    }
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Healthcare MCP server running on port ${PORT}/mcp`);
});
