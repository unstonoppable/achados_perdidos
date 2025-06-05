-- Tabela de Usuários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    matricula VARCHAR(50) UNIQUE,
    tipo VARCHAR(20) NOT NULL DEFAULT 'aluno', -- pode ser 'aluno', 'servidor', 'admin'
    foto_perfil_url VARCHAR(255),
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens
CREATE TABLE itens (
    id SERIAL PRIMARY KEY,
    id_usuario_encontrou INTEGER NOT NULL REFERENCES usuarios(id),
    nome_item VARCHAR(100) NOT NULL,
    descricao TEXT,
    local_encontrado VARCHAR(255),
    data_encontrado DATE,
    turno_encontrado VARCHAR(50), -- Manhã, Tarde, Noite
    categoria VARCHAR(100),
    foto_item_url VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'achado', -- 'achado', 'perdido', 'reivindicado', 'entregue', 'expirado'
    data_cadastro_item TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Campos para quando o item é entregue
    id_usuario_retirou INTEGER REFERENCES usuarios(id), -- Quem retirou (se for um usuário do sistema)
    nome_pessoa_retirou VARCHAR(100), -- Nome de quem retirou (se não for usuário do sistema)
    matricula_recebedor VARCHAR(50),
    data_entrega TIMESTAMP WITH TIME ZONE,
    
    -- Campos para controle administrativo
    local_retirada VARCHAR(255) DEFAULT 'Guarita',
    data_limite_retirada DATE
);

-- Tabela para sessões (se estiver usando connect-pg-simple)
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
	"sess" json NOT NULL,
	"expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire"); 