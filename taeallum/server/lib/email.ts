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
        from: `"منصة تعلّم (Taallm)" <${smtpConfig.auth.user}>`,
        to,
        subject: `${code} هو رمز التحقق الخاص بك في منصة تعلّم`,
        priority: "high" as const,
        headers: {
            "X-Priority": "1 (Highest)",
            "X-MSMail-Priority": "High",
            "Importance": "high",
            "X-Entity-Ref-ID": Date.now().toString()
        },
        text: `مرحباً بك في منصة تعلّم.\n\nرمز التحقق الخاص بك هو: ${code}\n\nهذا الرمز صالح لمدة 10 دقائق فقط.`,
        html: `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #f8f9fa; padding: 30px 20px; text-align: center; border-bottom: 2px solid #4CAF50;">
                    <img src="https://taallm.com/brand/logo.png" alt="Taallm Logo" style="max-width: 140px; height: auto; display: block; margin: 0 auto 15px;">
                    <h1 style="margin: 0; color: #333; font-size: 24px;">منصة تعلّم (Taallm)</h1>
                </div>
                <div style="padding: 40px 30px;">
                    <h2 style="color: #4CAF50; text-align: center; margin-top: 0;">مرحباً بك في رحلة التعلّم!</h2>
                    <p style="font-size: 16px; line-height: 1.8; color: #555; text-align: center;">شكراً لتسجيلك معنا. لتفعيل حسابك والبدء في بناء مستقبلك، يرجى استخدام الرمز التالي:</p>
                    <div style="background: #f1f8e9; padding: 25px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; border-radius: 12px; margin: 30px 0; color: #2e7d32; border: 2px solid #c8e6c9;">
                        ${code}
                    </div>
                    <p style="font-size: 14px; color: #888; text-align: center;">هذا الرمز صالح لمدة 10 دقائق فقط لدواعي الأمان.</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #999; margin: 0;">إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد بأمان.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
                    <p style="font-size: 13px; color: #666; margin: 0;">© 2026 منصة تعلّم. جميع الحقوق محفوظة.</p>
                    <div style="margin-top: 10px;">
                        <a href="https://taallm.com" style="color: #4CAF50; text-decoration: none; font-size: 12px;">موقعنا الإلكتروني</a>
                    </div>
                </div>
            </div>
        `,
    };

    try {
        console.log(`[EMAIL] Sending OTP to ${to}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SUCCESS] OTP Sent: ${info.messageId}`);
        return true;
    } catch (error: any) {
        console.error("[EMAIL ERROR]", error);
        return false;
    }
}

export async function sendPasswordResetEmail(to: string, code: string) {
    const mailOptions = {
        from: `"منصة تعلّم (Taallm)" <${smtpConfig.auth.user}>`,
        to,
        subject: "إعادة تعيين كلمة المرور - منصة تعلّم",
        priority: "high" as const,
        text: `طلب إعادة تعيين كلمة المرور.\n\nرمز إعادة التعيين الخاص بك هو: ${code}\n\nإذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد.`,
        html: `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #f8f9fa; padding: 30px 20px; text-align: center; border-bottom: 2px solid #FF9800;">
                    <img src="https://taallm.com/brand/logo.png" alt="Taallm Logo" style="max-width: 140px; height: auto; display: block; margin: 0 auto 15px;">
                    <h1 style="margin: 0; color: #333; font-size: 24px;">استعادة الحساب</h1>
                </div>
                <div style="padding: 40px 30px;">
                    <h2 style="color: #FF9800; text-align: center; margin-top: 0;">طلب إعادة تعيين كلمة المرور</h2>
                    <p style="font-size: 16px; line-height: 1.8; color: #555; text-align: center;">لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. يرجى استخدام الرمز التالي لإكمال العملية:</p>
                    <div style="background: #fff3e0; padding: 25px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; border-radius: 12px; margin: 30px 0; color: #e65100; border: 2px solid #ffe0b2;">
                        ${code}
                    </div>
                    <p style="font-size: 14px; color: #888; text-align: center;">إذا لم تطلب هذا الطلب، يرجى تغيير كلمة المرور الخاصة بك فوراً وتأمين حسابك.</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
                    <p style="font-size: 13px; color: #666; margin: 0;">© 2026 منصة تعلّم. جميع الحقوق محفوظة.</p>
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("[EMAIL RESET ERROR]", error);
        return false;
    }
}

