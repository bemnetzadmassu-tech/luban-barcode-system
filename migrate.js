const { Pool } = require('pg');
require('dotenv').config();

// Use DATABASE_URL as-is – no extra ssl option
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const createTable = `
CREATE TABLE IF NOT EXISTS serialized_barcodes (
    id SERIAL PRIMARY KEY,
    barcode_value TEXT UNIQUE NOT NULL,
    origin TEXT,
    batch_info TEXT,
    weight_grams INTEGER DEFAULT 500,
    roast_level TEXT DEFAULT 'MR',
    is_activated BOOLEAN DEFAULT FALSE,
    is_sold BOOLEAN DEFAULT FALSE,
    is_revoked BOOLEAN DEFAULT FALSE,
    verification_count INTEGER DEFAULT 0,
    last_verified TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sold_at TIMESTAMP,
    sold_price DECIMAL(10,2)
);

CREATE INDEX IF NOT EXISTS idx_barcode_value ON serialized_barcodes(barcode_value);
CREATE INDEX IF NOT EXISTS idx_origin ON serialized_barcodes(origin);
`;

(async () => {
    try {
        await pool.query(createTable);
        console.log('✅ Table created successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
})();