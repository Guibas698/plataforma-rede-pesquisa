ALTER TABLE links_candidato
ADD COLUMN IF NOT EXISTS responsavel_id UUID;

UPDATE links_candidato lc
SET responsavel_id = c.usuario_id
FROM candidatos c
WHERE lc.candidato_id = c.id
  AND lc.responsavel_id IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_links_candidato_responsavel'
          AND conrelid = 'links_candidato'::regclass
    ) THEN
        ALTER TABLE links_candidato
        ADD CONSTRAINT fk_links_candidato_responsavel
        FOREIGN KEY (responsavel_id)
        REFERENCES usuarios(id);
    END IF;
END $$;

ALTER TABLE links_candidato
ALTER COLUMN responsavel_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_links_candidato_responsavel_id
ON links_candidato(responsavel_id);