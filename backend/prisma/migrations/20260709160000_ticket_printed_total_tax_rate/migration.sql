-- Total impreso en el recibo (referencia) + tasa de impuesto fijada al escanear
ALTER TABLE `Ticket`
  ADD COLUMN `printedTotal` DECIMAL(10, 2) NULL,
  ADD COLUMN `scanTaxRate` DECIMAL(8, 6) NULL;

UPDATE `Ticket`
SET `printedTotal` = `total`
WHERE `printedTotal` IS NULL AND `total` IS NOT NULL;

UPDATE `Ticket`
SET `scanTaxRate` = ROUND(`tax` / `subtotal`, 6)
WHERE `scanTaxRate` IS NULL
  AND `subtotal` IS NOT NULL
  AND `subtotal` > 0
  AND COALESCE(`tax`, 0) > 0;

UPDATE `Ticket`
SET `scanTaxRate` = ROUND(
  (`total` - `subtotal` - COALESCE(`discount`, 0)) / `subtotal`,
  6
)
WHERE `scanTaxRate` IS NULL
  AND `subtotal` IS NOT NULL
  AND `subtotal` > 0
  AND `total` IS NOT NULL
  AND (`total` - `subtotal` - COALESCE(`discount`, 0)) > 0;
