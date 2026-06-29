const pool = require('./_lib/db');
const auth = require('./_lib/auth');
const Joi = require('joi');

const schema = Joi.object({
    prefix: Joi.string().required(),
    start: Joi.number().integer().min(1).required(),
    end: Joi.number().integer().min(1).required(),
    origin: Joi.string().required(),
    batchInfo: Joi.string().allow(''),
});

module.exports = async (req, res) => {
    await auth(req, res, async () => {
        const { error, value } = schema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { prefix, start, end, origin, batchInfo } = value;
        const pad = 5;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            let updated = 0;
            for (let i = start; i <= end; i++) {
                const num = String(i).padStart(pad, '0');
                const barcode = prefix + num;
                const result = await client.query(
                    `UPDATE serialized_barcodes 
                     SET origin = $1, batch_info = $2 
                     WHERE barcode_value = $3`,
                    [origin, batchInfo || '', barcode]
                );
                updated += result.rowCount;
            }
            await client.query('COMMIT');
            res.json({
                success: true,
                count: updated,
                origin,
                range: `${prefix}${String(start).padStart(pad, '0')} – ${prefix}${String(end).padStart(pad, '0')}`
            });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(err);
            res.status(500).json({ error: 'Database error' });
        } finally {
            client.release();
        }
    });
};
