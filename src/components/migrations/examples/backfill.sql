-- Commit each batch separately. Existing orders in this scenario are USD.
WITH batch AS (
    SELECT id FROM orders
    WHERE currency IS NULL
    ORDER BY id
    LIMIT 2
    FOR UPDATE
)
UPDATE orders AS o
SET currency = 'USD'
FROM batch
WHERE o.id = batch.id AND o.currency IS NULL
RETURNING o.id;
