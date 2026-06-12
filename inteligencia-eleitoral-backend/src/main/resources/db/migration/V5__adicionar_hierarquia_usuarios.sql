ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS superior_id UUID;

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS adm_raiz_id UUID;

UPDATE usuarios
SET adm_raiz_id = id
WHERE papel = 'ADM'
  AND adm_raiz_id IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_usuarios_superior'
          AND conrelid = 'usuarios'::regclass
    ) THEN
        ALTER TABLE usuarios
        ADD CONSTRAINT fk_usuarios_superior
        FOREIGN KEY (superior_id)
        REFERENCES usuarios(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_usuarios_adm_raiz'
          AND conrelid = 'usuarios'::regclass
    ) THEN
        ALTER TABLE usuarios
        ADD CONSTRAINT fk_usuarios_adm_raiz
        FOREIGN KEY (adm_raiz_id)
        REFERENCES usuarios(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usuarios_superior_id
ON usuarios(superior_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_adm_raiz_id
ON usuarios(adm_raiz_id);