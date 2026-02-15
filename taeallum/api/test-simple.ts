
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    res.status(200).json({
        status: 'ok',
        message: 'Simplified Vercel function working',
        env: process.env.NODE_ENV,
        time: new Date().toISOString()
    });
}
