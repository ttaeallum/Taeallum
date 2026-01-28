import express from "express";

const app = express();

app.get("/api/hello", (req, res) => {
    res.json({ message: "API INDEX IS WORKING!", version: "6.2" });
});

export default app;
