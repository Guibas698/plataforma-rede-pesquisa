CREATE TABLE IF NOT EXISTS termos_consentimento (
    id UUID PRIMARY KEY,
    titulo VARCHAR(150),
    versao VARCHAR(20),
    texto TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP
);

ALTER TABLE termos_consentimento
ADD COLUMN IF NOT EXISTS titulo VARCHAR(150);

ALTER TABLE termos_consentimento
ADD COLUMN IF NOT EXISTS versao VARCHAR(20);

ALTER TABLE termos_consentimento
ADD COLUMN IF NOT EXISTS texto TEXT;

ALTER TABLE termos_consentimento
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

ALTER TABLE termos_consentimento
ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE termos_consentimento
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP;

UPDATE termos_consentimento
SET titulo = 'Termo de Consentimento para Cadastro de Apoiador'
WHERE titulo IS NULL;

UPDATE termos_consentimento
SET versao = '1.0'
WHERE versao IS NULL;

UPDATE termos_consentimento
SET texto = 'Ao prosseguir com o cadastro, declaro que autorizo o tratamento dos meus dados pessoais informados neste formulário para fins de organização, comunicação e gestão de apoiadores no sistema Mapa Eleitoral.

Estou ciente de que os dados fornecidos, como nome, telefone, município, bairro, zona eleitoral e seção eleitoral, serão vinculados ao candidato responsável pelo link de cadastro utilizado.

Declaro também estar ciente de que este cadastro representa uma manifestação voluntária de apoio ou interesse, não correspondendo a voto oficial, promessa de voto ou obrigação eleitoral.

O tratamento dos dados deverá observar princípios de finalidade, necessidade, transparência e segurança, conforme a Lei Geral de Proteção de Dados Pessoais.'
WHERE texto IS NULL;

UPDATE termos_consentimento
SET ativo = TRUE
WHERE ativo IS NULL;

UPDATE termos_consentimento
SET criado_em = CURRENT_TIMESTAMP
WHERE criado_em IS NULL;

ALTER TABLE termos_consentimento
ALTER COLUMN titulo SET NOT NULL;

ALTER TABLE termos_consentimento
ALTER COLUMN versao SET NOT NULL;

ALTER TABLE termos_consentimento
ALTER COLUMN texto SET NOT NULL;

ALTER TABLE termos_consentimento
ALTER COLUMN ativo SET NOT NULL;

ALTER TABLE termos_consentimento
ALTER COLUMN criado_em SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_termos_consentimento_ativo
ON termos_consentimento (ativo);

INSERT INTO termos_consentimento (
    id,
    titulo,
    versao,
    texto,
    ativo,
    criado_em,
    atualizado_em
)
SELECT
    '11111111-1111-1111-1111-111111111111',
    'Termo de Consentimento para Cadastro de Apoiador',
    '1.0',
    'Ao prosseguir com o cadastro, declaro que autorizo o tratamento dos meus dados pessoais informados neste formulário para fins de organização, comunicação e gestão de apoiadores no sistema Mapa Eleitoral.

Estou ciente de que os dados fornecidos, como nome, telefone, município, bairro, zona eleitoral e seção eleitoral, serão vinculados ao candidato responsável pelo link de cadastro utilizado.

Declaro também estar ciente de que este cadastro representa uma manifestação voluntária de apoio ou interesse, não correspondendo a voto oficial, promessa de voto ou obrigação eleitoral.

O tratamento dos dados deverá observar princípios de finalidade, necessidade, transparência e segurança, conforme a Lei Geral de Proteção de Dados Pessoais.',
    TRUE,
    CURRENT_TIMESTAMP,
    NULL
WHERE NOT EXISTS (
    SELECT 1 FROM termos_consentimento WHERE ativo = TRUE
);