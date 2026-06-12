ALTER TABLE usuarios
DROP CONSTRAINT IF EXISTS chk_usuarios_papel;

UPDATE usuarios
SET papel = 'ADM'
WHERE papel = 'CANDIDATO';

UPDATE usuarios
SET papel = 'USUARIO'
WHERE papel = 'APOIADOR';

ALTER TABLE usuarios
ADD CONSTRAINT chk_usuarios_papel
CHECK (papel IN ('MASTER', 'ADM', 'LIDER', 'USUARIO'));