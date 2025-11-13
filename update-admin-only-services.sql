-- Oppdater spesifikke tjenester til kun admin
-- Dette er tjenester med bedriftsavtaler/spesialpriser

UPDATE services 
SET isAdminOnly = 1 
WHERE name LIKE '%Alleen Auto%' 
   OR name LIKE '%Eksklusiv pakke%bedrift%'
   OR name LIKE '%Spesialpris%'
   OR name LIKE '%Avtale%';

-- Vis hvilke tjenester som ble oppdatert
SELECT id, name, isAdminOnly 
FROM services 
WHERE isAdminOnly = 1;

