import http from "http";

async function runTests() {
  console.log("=== STARTING OPTIGUARD AI END-TO-END VERIFICATION ===");

  const BASE_URL = "http://localhost:5000";

  // Helper for HTTP requests
  async function makeRequest(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const headers = options.headers || {};
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : undefined,
    });

    const status = response.status;
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    return { status, data };
  }

  // 1. Check Health
  console.log("\n[Test 1] Testing /api/health...");
  const health = await makeRequest("/api/health");
  console.log("Health Status:", health.status, health.data);
  if (health.status !== 200) throw new Error("Health check failed");

  // 2. Test Login with Demo Credentials
  console.log("\n[Test 2] Testing /api/auth/login with pre-seeded Demo Inspector...");
  const login = await makeRequest("/api/auth/login", {
    method: "POST",
    body: {
      email: "demo@optiguard.ai",
      password: "DemoPass123!",
    },
  });
  console.log("Login Status:", login.status, "User:", login.data?.user?.email);
  if (login.status !== 200 || !login.data?.token) throw new Error("Demo login failed");
  const token = login.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Test /api/auth/me
  console.log("\n[Test 3] Testing /api/auth/me with Bearer token...");
  const me = await makeRequest("/api/auth/me", { headers: authHeaders });
  console.log("Me Status:", me.status, "FullName:", me.data?.user?.fullName);
  if (me.status !== 200) throw new Error("/api/auth/me failed");

  // 4. Test /api/inspections list
  console.log("\n[Test 4] Testing GET /api/inspections (Tenant Isolated)...");
  const list = await makeRequest("/api/inspections", { headers: authHeaders });
  console.log("Inspections Count:", list.data?.count);
  if (list.status !== 200 || list.data?.count === 0) throw new Error("Listing inspections failed");

  const targetReport = list.data.inspections[0];
  console.log(`Inspecting report: "${targetReport.title}" (${targetReport.id})`);

  // 5. Test /api/inspections/:id
  console.log(`\n[Test 5] Testing GET /api/inspections/${targetReport.id}...`);
  const detail = await makeRequest(`/api/inspections/${targetReport.id}`, { headers: authHeaders });
  console.log("Detail Status:", detail.status, "Anomalies:", detail.data?.report?.anomalies?.length);
  if (detail.status !== 200 || !detail.data?.report?.anomalies) throw new Error("Detail fetch failed");

  // 6. Test /api/inspections/:id/chat (Visual Copilot)
  console.log(`\n[Test 6] Testing POST /api/inspections/${targetReport.id}/chat...`);
  const chat = await makeRequest(`/api/inspections/${targetReport.id}/chat`, {
    method: "POST",
    headers: authHeaders,
    body: { message: "Does the solder bridge indicate an aperture stencil defect?" },
  });
  console.log("Chat Status:", chat.status);
  console.log("AI Answer:", chat.data?.reply?.message_text);
  console.log("Suggested Followups:", chat.data?.reply?.suggested_followups);
  if (chat.status !== 200 || !chat.data?.reply?.message_text) throw new Error("Copilot chat failed");

  // 7. Test /api/inspections/analyze (New Scan)
  console.log("\n[Test 7] Testing POST /api/inspections/analyze with benchmark sample image...");
  const sampleDataUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='red'/></svg>";
  const analyze = await makeRequest("/api/inspections/analyze", {
    method: "POST",
    headers: authHeaders,
    body: {
      title: "Automated Test Inspection Scan",
      domain: "MANUFACTURING_QC",
      assetIdentifier: "TEST-ASSET-099",
      facilityLocation: "Test Lab A",
      complianceStandard: "ISO-9001",
      sensitivityLevel: "HIGH_PRECISION",
      operatorNotes: "Automated test script verification scan.",
      sampleImageBase64: sampleDataUrl,
      sampleMimeType: "image/svg+xml",
    },
  });
  console.log("Analyze Status:", analyze.status, "Verdict:", analyze.data?.report?.verdict, "Health:", analyze.data?.report?.health_score);
  if (analyze.status !== 201 || !analyze.data?.report?.id) throw new Error("Analyze scan failed");

  // 8. Test /api/inspections/compare (Before/After Delta)
  console.log("\n[Test 8] Testing POST /api/inspections/compare (Dual Image Delta)...");
  const compare = await makeRequest("/api/inspections/compare", {
    method: "POST",
    headers: authHeaders,
    body: {
      title: "Test Delta Analysis Verification",
      domain: "INFRASTRUCTURE_CIVIL",
      assetIdentifier: "TEST-ASSET-099",
      comparisonObjective: "REPAIR_VERIFICATION",
      baselineImageBase64: sampleDataUrl,
      currentImageBase64: sampleDataUrl,
    },
  });
  console.log("Compare Status:", compare.status, "Verdict:", compare.data?.comparison?.change_verdict, "DeltaScore:", compare.data?.comparison?.delta_score);
  if (compare.status !== 201 || !compare.data?.comparison?.id) throw new Error("Comparison failed");

  // 9. Test /api/analytics/summary
  console.log("\n[Test 9] Testing GET /api/analytics/summary...");
  const analytics = await makeRequest("/api/analytics/summary", { headers: authHeaders });
  console.log("Analytics Status:", analytics.status, "Metrics:", analytics.data?.metrics);
  if (analytics.status !== 200 || analytics.data?.metrics?.totalInspections < 1) throw new Error("Analytics failed");

  console.log("\n🎉 ALL 9 OPTIGUARD AI SYSTEM SUITE TESTS PASSED SUCCESSFULLY! 🎉\n");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});

