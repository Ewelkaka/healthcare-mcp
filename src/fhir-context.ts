export interface FhirContext {
  fhirUrl: string
  fhirToken?: string
  patientId?: string
}

export function extractFhirContext(headers: Record<string, string | undefined>): FhirContext | null {
  const fhirUrl = headers["x-fhir-server-url"]
  if (!fhirUrl) return null

  return {
    fhirUrl,
    fhirToken: headers["x-fhir-access-token"],
    patientId: headers["x-patient-id"],
  }
}

export async function fetchFhir(resourceType: string, context: FhirContext, params?: Record<string, string>): Promise<unknown> {
  const url = new URL(`${context.fhirUrl}/${resourceType}`)
  if (context.patientId && resourceType !== "Patient") {
    url.searchParams.set("patient", context.patientId)
  }
  if (params) {
    Object.entries(params).forEach(([key, val]) => url.searchParams.set(key, val))
  }

  const headers: Record<string, string> = {}
  if (context.fhirToken) {
    headers["Authorization"] = `Bearer ${context.fhirToken}`
  }

  const res = await fetch(url.toString(), { headers })
  if (!res.ok) throw new Error(`FHIR request failed: ${res.status} ${res.statusText}`)
  return res.json()
}
