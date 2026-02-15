import nodemailer from "nodemailer";

// SMTP Configuration
// These should ideally be in .env
const smtpConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE?.toLowerCase() === "true" || process.env.SMTP_PORT === "465",
    auth: {
        user: process.env.SMTP_USER || "ttaeallum@gmail.com",
        pass: process.env.SMTP_PASS || "Aa@962962",
    },
    tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
    }
};

console.log(`[EMAIL] Initializing with host: ${smtpConfig.host}, port: ${smtpConfig.port}, secure: ${smtpConfig.secure}, user: ${smtpConfig.auth.user}`);

const transporter = nodemailer.createTransport(smtpConfig);

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error("[EMAIL CONFIG ERROR]", error);
    } else {
        console.log("[EMAIL CONFIG SUCCESS] Server is ready to take our messages");
    }
});

export async function sendVerificationEmail(to: string, code: string) {
    const mailOptions = {
        from: `"منصة تعلّم" <${smtpConfig.auth.user}>`,
        to,
        subject: "رمز التحقق لمنصة تعلّم",
        priority: "high" as const,
        headers: {
            "X-Priority": "1 (Highest)",
            "X-MSMail-Priority": "High",
            "Importance": "high"
        },
        html: `
            <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://taallm.com/brand/logo.png" alt="منصة تعلّم" style="max-width: 150px; height: auto;">
                </div>
                <h2 style="color: #4CAF50; text-align: center;">مرحباً بك في منصة تعلّم</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #333;">شكراً لتسجيلك معنا. يرجى استخدام الرمز التالي لتفعيل حسابك:</p>
                <div style="background: #f9f9f9; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 10px; border-radius: 8px; margin: 25px 0; color: #4CAF50; border: 1px dashed #4CAF50;">
                    ${code}
                </div>
                <p style="font-size: 14px; color: #666;">هذا الرمز صالح لمدة 10 دقائق فقط.</p>
                <p style="font-size: 14px; color: #666;">إذا لم تكن قد طلبت هذا الرمز، يرجى تجاهل هذا البريد.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">© 2026 منصة تعلّم. جميع الحقوق محفوظة.</p>
            </div>
        `,
    };

    try {
        console.log(`[EMAIL] Attempting to send email to ${to} via ${smtpConfig.host}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SUCCESS] Message sent: ${info.messageId}`);
        return true;
    } catch (error: any) {
        console.error("[EMAIL ERROR] Failed to send email:", {
            code: error.code,
            command: error.command,
            response: error.response,
            stack: error.stack
        });
        return false;
    }
}
