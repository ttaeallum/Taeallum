import express from "express";

const app = express();

// رابط تشخيصي مستقل تماما (بدون أي استيراد للمشروع)
app.get("/api/debug", (req, res) => {
    res.json({
        message: "DEBUG SUCCESS: Vercel is running the API!",
        time: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
});

// رابط تجربة السيرفر الرئيسي
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from Taeallum!" });
});

export default app;
