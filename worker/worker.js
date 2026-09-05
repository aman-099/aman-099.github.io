export default {
  async fetch(request) {
    const url = new URL(request.url);
    const appId = url.searchParams.get("id");
    if (!appId) {
      return new Response(JSON.stringify({ error: "Missing ?id= param" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    try {
      const res = await fetch(
        `https://play.rajkumaar.co.in/json?id=${encodeURIComponent(appId)}`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      if (!res.ok) {
        return new Response(JSON.stringify({ error: `Play Store ${res.status}` }), {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
