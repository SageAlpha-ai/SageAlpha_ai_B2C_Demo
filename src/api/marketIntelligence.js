import CONFIG from "../config";

/**
 * Fetch market intelligence for a given ticker
 * @param {string} ticker - Stock ticker symbol (e.g., "AAPL", "ZOMATO")
 * @returns {Promise<Object>} Normalized market intelligence data
 */
export async function getMarketIntelligence(ticker) {
  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    throw new Error("Ticker is required");
  }

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/market-intelligence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ ticker: ticker.trim().toUpperCase() })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.status === "success" && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || "Invalid response format from server");
    }
  } catch (error) {
    console.error("[MarketIntelligence] API Error:", error);
    throw error;
  }
}

