# Healthcare MCP Server - Deployment Guide

## Quick Deploy to Render

1. **Push to GitHub**
   ```bash
   cd /home/ewelinalesiak7/opencode/healthcare-mcp
   git init
   git add .
   git commit -m "Initial commit: Healthcare MCP Server"
   # Create repo on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/healthcare-mcp.git
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Configuration:
     - **Name**: healthcare-mcp
     - **Runtime**: Docker
     - **Instance Type**: Free
     - **Environment Variables**:
       - `TRANSPORT`: `http`
       - `PORT`: `8080`

3. **Deploy**
   - Click "Create Web Service"
   - Wait ~2-3 minutes for build
   - Your server URL: `https://healthcare-mcp.onrender.com/mcp`

## Test Your Deployment

```bash
# Test initialize
curl -X POST https://healthcare-mcp.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```

## Add to Prompt Opinion

1. Log in to https://app.promptopinion.ai
2. Go to **Configuration → MCP Servers**
3. Click **Add MCP Server**
4. Enter your server URL: `https://healthcare-mcp.onrender.com/mcp`
5. When prompted, enable **FHIR Context Extension**
6. Authorize scopes:
   - `patient/Patient.rs` (required)
   - `patient/Condition.rs`
   - `patient/MedicationRequest.rs`
   - `patient/Observation.rs`

## Demo Video Script (3 minutes)

1. **Intro (30s)**: Explain healthcare MCP server for Patient Summary
2. **Code Walkthrough (60s)**: Show `src/server.ts` and tools in `src/tools/healthcare.ts`
3. **Live Demo (60s)**:
   - Open Prompt Opinion
   - Add MCP server
   - Enable FHIR context
   - Query patient data
4. **Conclusion (30s)**: Benefits of standardized healthcare AI tools

## Submission Checklist

- [ ] Server deployed to public URL
- [ ] Successfully added to Prompt Opinion
- [ ] FHIR context working (test with sample patient)
- [ ] Demo video recorded (< 3 minutes)
- [ ] Submitted at https://www.promptopinion.ai/agents-assemble-challenge

**Deadline: May 11, 2026**

## Resources

- Prompt Opinion Docs: https://docs.promptopinion.ai/
- SHARP-on-MCP Spec: https://sharponmcp.com/
- MCP SDK Docs: https://modelcontextprotocol.io/
