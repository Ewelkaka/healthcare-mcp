import { z } from "zod"
import type { FhirContext } from "../fhir-context.js"
import { fetchFhir } from "../fhir-context.js"

type PatientResource = {
  name?: Array<{ given?: string[]; family?: string }>
  birthDate?: string
  gender?: string
}

type ConditionResource = {
  code?: { text?: string }
  clinicalStatus?: { coding?: Array<{ code?: string }> }
  recordedDate?: string
}

type MedicationRequestResource = {
  id: string
  medicationCodeableConcept?: { text?: string }
  authoredOn?: string
  dosageInstruction?: Array<{ text?: string }>
}

type ObservationResource = {
  code?: { text?: string }
  valueQuantity?: { value: number; unit?: string }
  issued?: string
}

type Bundle<T> = {
  entry?: Array<{ resource: T }>
}

export function getPatientSummary(context: FhirContext) {
  return async () => {
    if (!context.patientId) return { content: [{ type: "text" as const, text: "No patient ID provided" }] }

    const [patient, conditions, meds] = await Promise.all([
      fetchFhir("Patient", context, { _id: context.patientId }),
      fetchFhir("Condition", context, { clinicalStatus: "active" }),
      fetchFhir("MedicationRequest", context, { status: "active" }),
    ])

    const patientBundle = patient as Bundle<PatientResource>
    const p = patientBundle.entry?.[0]?.resource
    const name = p?.name?.[0]
    const fullName = `${name?.given?.join(" ") ?? ""} ${name?.family ?? ""}`.trim()
    const dob = p?.birthDate ?? "unknown"
    const gender = p?.gender ?? "unknown"

    const condBundle = conditions as Bundle<{ code?: { text?: string } }>
    const condList = (condBundle.entry ?? [])
      .map((e) => e.resource.code?.text)
      .filter(Boolean)
      .join(", ")

    const medBundle = meds as Bundle<{ medicationCodeableConcept?: { text?: string } }>
    const medList = (medBundle.entry ?? [])
      .map((e) => e.resource.medicationCodeableConcept?.text)
      .filter(Boolean)
      .join(", ")

    const summary = [
      `Patient: ${fullName || context.patientId}`,
      `DOB: ${dob}, Gender: ${gender}`,
      `Active Conditions: ${condList || "None"}`,
      `Active Medications: ${medList || "None"}`,
    ].join("\n")

    return { content: [{ type: "text" as const, text: summary }] }
  }
}

export function getMedications(context: FhirContext) {
  return async () => {
    const meds = await fetchFhir("MedicationRequest", context, { status: "active" })
    const medBundle = meds as Bundle<MedicationRequestResource>
    const entries = medBundle.entry ?? []

    const list = entries
      .map((e) => {
        const r = e.resource
        return `- ${r.medicationCodeableConcept?.text ?? r.id}: ${r.dosageInstruction?.[0]?.text ?? ""} (${r.authoredOn ?? ""})`
      })
      .join("\n")

    return { content: [{ type: "text" as const, text: list || "No active medications" }] }
  }
}

export function getLabResults(context: FhirContext) {
  return async () => {
    const obs = await fetchFhir("Observation", context, { category: "laboratory", _sort: "-date", _count: "20" })
    const obsBundle = obs as Bundle<ObservationResource>
    const entries = obsBundle.entry ?? []

    const list = entries
      .map((e) => {
        const r = e.resource
        const val = r.valueQuantity ? `${r.valueQuantity.value} ${r.valueQuantity.unit ?? ""}` : ""
        return `- ${r.code?.text ?? "Unknown"}: ${val} (${r.issued ?? ""})`
      })
      .join("\n")

    return { content: [{ type: "text" as const, text: list || "No lab results found" }] }
  }
}

export function getConditions(context: FhirContext) {
  return async () => {
    const conds = await fetchFhir("Condition", context)
    const condBundle = conds as Bundle<ConditionResource>
    const entries = condBundle.entry ?? []

    const list = entries
      .map((e) => {
        const r = e.resource
        const status = r.clinicalStatus?.coding?.[0]?.code ?? ""
        return `- ${r.code?.text ?? "Unknown"} [${status}] (${r.recordedDate ?? ""})`
      })
      .join("\n")

    return { content: [{ type: "text" as const, text: list || "No conditions found" }] }
  }
}

export const toolDefinitions = [
  {
    name: "get_patient_summary",
    description: "Get a comprehensive summary of the current patient including demographics, active conditions, and medications",
    inputSchema: z.object({}),
  },
  {
    name: "get_medications",
    description: "Get active medications for the current patient",
    inputSchema: z.object({}),
  },
  {
    name: "get_lab_results",
    description: "Get recent laboratory results for the current patient",
    inputSchema: z.object({}),
  },
  {
    name: "get_conditions",
    description: "Get all conditions for the current patient with clinical status",
    inputSchema: z.object({}),
  },
]
