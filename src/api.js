const API_BASE = "https://fashion-api-37s7.onrender.com";

export async function getRecommendations(params) {
  const response = await fetch(`${API_BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!response.ok) {
    let msg = "API error";
    try {
      const err = await response.json();
      msg = err.detail || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return response.json();
}