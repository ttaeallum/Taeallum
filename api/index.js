const express = require("express");

const app = express();

app.use(express.json());

app.get("/api/hello", (req, res) => {
    res.json({ status: "ok", message: "Server is alive!" });
});

app.post("/api/auth/register", (req, res) => {
    res.json({ message: "Registration endpoint working", data: req.body });
});

app.post("/api/auth/login", (req, res) => {
    res.json({ message: "Login endpoint working", data: req.body });
});

module.exports = app;
