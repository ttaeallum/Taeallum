import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function migrate() {
    // Create promo_codes table
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS promo_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code TEXT NOT NULL UNIQUE,
            discount_percent INTEGER NOT NULL,
            discount_amount DECIMAL(10,2),
            is_active BOOLEAN NOT NULL DEFAULT true,
            usage_count INTEGER NOT NULL DEFAULT 0,
            usage_limit INTEGER,
            expires_at TIMESTAMP,
            description TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    `);
    console.log('✅ promo_codes table created');

    // Create promo_code_usages table
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS promo_code_usages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            price_paid DECIMAL(10,2) NOT NULL,
            original_price DECIMAL(10,2) NOT NULL,
            used_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    `);
    console.log('✅ promo_code_usages table created');

    // Insert default TAALLUM70 code
    await db.execute(sql`
        INSERT INTO promo_codes (code, discount_percent, description, is_active)
        VALUES ('TAALLUM70', 72, 'الكود الافتراضي - خصم 72%', true)
        ON CONFLICT (code) DO NOTHING
    `);
    console.log('✅ TAALLUM70 promo code seeded');
}

migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
