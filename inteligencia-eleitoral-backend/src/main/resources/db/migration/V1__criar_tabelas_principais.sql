CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(160) NOT NULL,
    email VARCHAR(160) NOT NULL,
    telefone VARCHAR(30),
    senha_hash VARCHAR(255) NOT NULL,
    papel VARCHAR(30) NOT NULL,
    foto_url TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_usuarios_email UNIQUE (email),

    CONSTRAINT chk_usuarios_papel
        CHECK (papel IN ('MASTER', 'CANDIDATO', 'APOIADOR'))
);

CREATE UNIQUE INDEX uk_usuarios_email_lower
    ON usuarios (LOWER(email));

CREATE INDEX idx_usuarios_papel
    ON usuarios (papel);

CREATE INDEX idx_usuarios_ativo
    ON usuarios (ativo);


CREATE TABLE municipios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL,
    codigo_ibge VARCHAR(20),
    estado CHAR(2) NOT NULL DEFAULT 'CE',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_municipios_codigo_ibge UNIQUE (codigo_ibge)
);

CREATE INDEX idx_municipios_nome
    ON municipios (nome);

CREATE INDEX idx_municipios_estado
    ON municipios (estado);

CREATE INDEX idx_municipios_ativo
    ON municipios (ativo);


CREATE TABLE candidatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    nome_publico VARCHAR(160) NOT NULL,
    partido VARCHAR(80) NOT NULL,
    numero_urna VARCHAR(20) NOT NULL,
    cargo_pretendido VARCHAR(80) NOT NULL,
    municipio_base VARCHAR(120) NOT NULL,
    observacao_interna TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_candidatos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id),

    CONSTRAINT uk_candidatos_usuario
        UNIQUE (usuario_id)
);

CREATE INDEX idx_candidatos_ativo
    ON candidatos (ativo);

CREATE INDEX idx_candidatos_municipio_base
    ON candidatos (municipio_base);

CREATE INDEX idx_candidatos_numero_urna
    ON candidatos (numero_urna);


CREATE TABLE links_candidato (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidato_id UUID NOT NULL,
    codigo VARCHAR(120) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_links_candidato_candidato
        FOREIGN KEY (candidato_id)
        REFERENCES candidatos (id),

    CONSTRAINT uk_links_candidato_codigo
        UNIQUE (codigo)
);

CREATE UNIQUE INDEX uk_links_candidato_codigo_lower
    ON links_candidato (LOWER(codigo));

CREATE INDEX idx_links_candidato_candidato_id
    ON links_candidato (candidato_id);

CREATE INDEX idx_links_candidato_ativo
    ON links_candidato (ativo);


CREATE TABLE apoiadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,
    candidato_id UUID NOT NULL,

    nome VARCHAR(160) NOT NULL,
    email VARCHAR(160),
    telefone VARCHAR(30) NOT NULL,

    municipio VARCHAR(120) NOT NULL,
    bairro VARCHAR(120) NOT NULL,
    zona_eleitoral INTEGER NOT NULL,
    secao_eleitoral INTEGER NOT NULL,

    observacao TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ATIVO',
    origem_cadastro VARCHAR(40) NOT NULL DEFAULT 'LINK_CANDIDATO',

    consentimento_aceito BOOLEAN NOT NULL DEFAULT FALSE,
    consentimento_data TIMESTAMP,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_apoiadores_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id),

    CONSTRAINT fk_apoiadores_candidato
        FOREIGN KEY (candidato_id)
        REFERENCES candidatos (id),

    CONSTRAINT uk_apoiadores_usuario
        UNIQUE (usuario_id),

    CONSTRAINT chk_apoiadores_status
        CHECK (status IN ('ATIVO', 'PENDENTE', 'INATIVO')),

    CONSTRAINT chk_apoiadores_origem
        CHECK (origem_cadastro IN ('LINK_CANDIDATO', 'LINK_GERAL', 'CADASTRO_MANUAL')),

    CONSTRAINT chk_apoiadores_zona_positiva
        CHECK (zona_eleitoral > 0),

    CONSTRAINT chk_apoiadores_secao_positiva
        CHECK (secao_eleitoral > 0),

    CONSTRAINT chk_apoiadores_consentimento_data
        CHECK (
            (consentimento_aceito = FALSE AND consentimento_data IS NULL)
            OR
            (consentimento_aceito = TRUE AND consentimento_data IS NOT NULL)
        )
);

CREATE INDEX idx_apoiadores_candidato_id
    ON apoiadores (candidato_id);

CREATE INDEX idx_apoiadores_usuario_id
    ON apoiadores (usuario_id);

CREATE INDEX idx_apoiadores_status
    ON apoiadores (status);

CREATE INDEX idx_apoiadores_ativo
    ON apoiadores (ativo);

CREATE INDEX idx_apoiadores_municipio
    ON apoiadores (municipio);

CREATE INDEX idx_apoiadores_bairro
    ON apoiadores (bairro);

CREATE INDEX idx_apoiadores_criado_em
    ON apoiadores (criado_em);


CREATE TABLE termos_consentimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(160) NOT NULL,
    versao VARCHAR(30) NOT NULL,
    texto TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_termos_consentimento_versao
        UNIQUE (versao)
);

CREATE INDEX idx_termos_consentimento_ativo
    ON termos_consentimento (ativo);

CREATE INDEX idx_termos_consentimento_criado_em
    ON termos_consentimento (criado_em);


CREATE TABLE consentimentos_apoiador (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apoiador_id UUID NOT NULL,
    termo_id UUID NOT NULL,
    aceito_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_origem VARCHAR(80),
    user_agent TEXT,

    CONSTRAINT fk_consentimentos_apoiador
        FOREIGN KEY (apoiador_id)
        REFERENCES apoiadores (id),

    CONSTRAINT fk_consentimentos_termo
        FOREIGN KEY (termo_id)
        REFERENCES termos_consentimento (id)
);

CREATE INDEX idx_consentimentos_apoiador_id
    ON consentimentos_apoiador (apoiador_id);

CREATE INDEX idx_consentimentos_termo_id
    ON consentimentos_apoiador (termo_id);

CREATE INDEX idx_consentimentos_aceito_em
    ON consentimentos_apoiador (aceito_em);


CREATE TABLE auditoria_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,
    tipo_evento VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    ip_origem VARCHAR(80),
    user_agent TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_auditoria_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
);

CREATE INDEX idx_auditoria_usuario_id
    ON auditoria_eventos (usuario_id);

CREATE INDEX idx_auditoria_tipo_evento
    ON auditoria_eventos (tipo_evento);

CREATE INDEX idx_auditoria_criado_em
    ON auditoria_eventos (criado_em);