
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || true
}));

app.use(express.json({ limit: "32kb" }));

// Basic health check
app.get("/api/health", (req, res) => {
  res.json({
    name: "OMEGA AI",
    status: "online",
    version: "1.0.0",
    services: {
      backend: "online",
      ai: "not_configured",
      discord: "not_connected",
      minecraft: "not_connected"
    }
  });
});

// API information
app.get("/api", (req, res) => {
  res.json({
    name: "OMEGA AI API",
    endpoints: [
      "GET /api/health",
      "GET /api",
      "POST /api/assistant"
    ]
  });
});

// AI endpoint — provider connection comes next
app.post("/api/assistant", async (req, res) => {
  const message = req.body?.message;

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      error: "Please provide a message."
    });
  }

  if (message.length > 4000) {
    return res.status(400).json({
      error: "Message must be 4000 characters or fewer."
    });
  }

  // Never expose API keys to the browser.
  if (!process.env.AI_API_KEY) {
    return res.status(503).json({
      error: "AI provider is not configured yet.",
      service: "OMEGA AI",
      nextStep: "Configure a supported AI provider securely."
    });
  }

  // A real AI provider will be connected in the next step.
  return res.status(501).json({
    error: "AI provider integration is not implemented yet."
  });
});

// Friendly response for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`OMEGA AI backend listening on port ${PORT}`);
});
