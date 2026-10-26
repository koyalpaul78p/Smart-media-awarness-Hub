
const express = require("express");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));
app.use(express.static(__dirname));

app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    const language = String(req.body?.language || "en");

    if (!message) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "AI is not configured. Add OPENAI_API_KEY in Render Environment."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          instructions: `You are Smart Media Awareness Hub, a digital media literacy and cyber safety assistant. Reply in ${language}. Be concise, helpful, and honest about uncertainty. Never ask for passwords or OTPs.`,
          input: message,
          max_output_tokens: 500
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: "AI service failed. Check API key and API billing."
      });
    }

    const reply = data.output_text ||
      (data.output || [])
        .flatMap(item => item.content || [])
        .filter(item => item.type === "output_text")
        .map(item => item.text)
        .join("\n");

    return res.json({ reply });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Server error."
    });
  }
});

app.post("/api/fact-check", async (req, res) => {
  try {
    const claim = String(req.body?.claim || "").trim();

    if (!claim) {
      return res.status(400).json({
        error: "Enter a claim to check."
      });
    }

    const key = process.env.GOOGLE_FACT_CHECK_API_KEY;

    if (!key) {
      return res.status(503).json({
        error: "Google Fact Check API key is not configured."
      });
    }

    const url = new URL(
      "https://factchecktools.googleapis.com/v1alpha1/claims:search"
    );

    url.searchParams.set("query", claim);
    url.searchParams.set("key", key);
    url.searchParams.set("pageSize", "5");

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: "Fact-check service failed."
      });
    }

    const matches = (data.claims || []).flatMap(item =>
      (item.claimReview || []).map(review => ({
        publisher: review.publisher?.name || "Fact-check publisher",
        text: review.title || item.text || "",
        rating: review.textualRating || "No rating listed",
        url: review.url || ""
      }))
    ).slice(0, 5);

    return res.json({ matches });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Fact-check server error."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Smart Media Awareness Hub server is running.");
});
