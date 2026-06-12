ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS titulo_eleitor_hash VARCHAR(255);

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS titulo_eleitor_ultimos4 VARCHAR(4);

CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_titulo_eleitor_hash
ON usuarios(titulo_eleitor_hash)
WHERE titulo_eleitor_hash IS NOT NULL;