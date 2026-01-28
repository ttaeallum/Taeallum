import express from "express";
import session from "express-session";

// استيراد مباشر لضمان ثبات البناء
import authRouter from "../server/routes/auth";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);

app.use(session({
    secret: process.env.SESSION_SECRET || "hamza-secret-2026",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: true,
        sameSite: "lax",
        httpOnly: true
    }
}));

// Route Hello بسيط جداً للتأكد من العمل
app.get("/api/hello", (req, res) => {
    res.json({
        status: "SUCCESS",
        version: "7.2",
        msg: "The build finally succeeded and the server is live!"
    });
});

// تفعيل الراوتر الأساسي للتسجيل
app.use("/api/auth", authRouter);

export default app;
