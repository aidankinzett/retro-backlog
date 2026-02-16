import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RAWG_API_KEY = Deno.env.get("RAWG_API_KEY")
const BASE_URL = "https://api.rawg.io/api"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathname = url.pathname.replace("/rawg-proxy", "")
    
    // Build the RAWG URL
    const rawgUrl = new URL(`${BASE_URL}${pathname}`)
    
    // Copy all query params from the incoming request
    url.searchParams.forEach((value, key) => {
      rawgUrl.searchParams.set(key, value)
    })
    
    // Force the API key
    if (!RAWG_API_KEY) {
      throw new Error("RAWG_API_KEY is not set")
    }
    rawgUrl.searchParams.set("key", RAWG_API_KEY)

    console.log(`Proxying request to: ${rawgUrl.toString().replace(RAWG_API_KEY, "REDACTED")}`)

    const response = await fetch(rawgUrl.toString())
    
    // Safely parse JSON or handle non-JSON responses
    let data;
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await response.json()
      } catch (e) {
        console.error("Error parsing RAWG JSON:", e)
        data = { error: "Failed to parse RAWG response" }
      }
    } else {
      const text = await response.text()
      console.warn(`Non-JSON response from RAWG (${response.status}):`, text.slice(0, 200))
      data = { error: "RAWG returned a non-JSON response", status: response.status }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: response.status,
    })
  } catch (err) {
    console.error("Proxy error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
