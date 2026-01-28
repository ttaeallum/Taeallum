import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import memorystore from "memorystore";
const MemoryStore = memorystore(session);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);

app.use(session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: process.env.SESSION_SECRET || "hamza-secret-2026",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: true, sameSite: "lax", httpOnly: true }
}));

// SAFE ROUTE LOADING (Dynamic Imports to prevent boot crashes)
app.post("/api/auth/:action", async (req, res, next) => {
    try {
        const auth = await import("../server/routes/auth");
        return auth.default(req, res, next);
    } catch (e: any) {
        res.status(500).json({ message: "Auth Error", details: e.message });
    }
});

app.get("/api/auth/me", async (req, res, next) => {
    try {
        const auth = await import("../server/routes/auth");
        return auth.default(req, res, next);
    } catch (e: any) {
        res.status(500).json({ message: "Auth Session Error", details: e.message });
    }
});

// DEFAULT HELLO FOR VERIFICATION
app.get("/api/hello", (req, res) => {
    res.json({ status: "ok", msg: "SUPER STABLE API ONLINE" });
});

// CATCH ALL OTHER API ROUTES
app.all("/api/:path*", async (req, res, next) => {
    const { path } = req.params;
    try {
        // Map path to router
        let router;
        if (path === "courses") router = await import("../server/routes/public-courses");
        else if (path === "chatbot") router = await import("../server/routes/chatbot");
        else if (path === "payments") router = await import("../server/routes/payments");

        if (router && router.default) {
            return router.default(req, res, next);
        }
        res.status(404).json({ message: `API Path /api/${path} not found or not yet mapped.` });
    } catch (e: any) {
        res.status(500).json({ message: "Router Load Error", path, details: e.message });
    }
});

export default app;
