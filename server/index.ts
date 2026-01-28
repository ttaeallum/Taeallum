import express from "express";

const app = express();

app.get("/api/hello", (req, res) => {
  res.json({
    status: "ok",
    message: "Ultimate Minimal Server is Live",
    time: new Date().toISOString()
  });
});

app.get("/api/env", (req, res) => {
  res.json({
    node_env: process.env.NODE_ENV,
    has_db: !!(process.env.DATABASE || process.env.DATABASE_URL),
    keys: Object.keys(process.env).filter(k => k.includes("DATA") || k.includes("URL"))
  });
});

export default app;
