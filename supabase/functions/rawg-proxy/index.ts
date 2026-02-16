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
    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: response.status,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
