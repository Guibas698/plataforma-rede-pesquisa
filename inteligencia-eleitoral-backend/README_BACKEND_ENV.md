# Configuração de Ambiente - Backend Mapa Eleitoral

Este documento explica como configurar as variáveis de ambiente do backend Spring Boot do projeto Mapa Eleitoral.

O objetivo é evitar credenciais fixas no código, como senha do Supabase, JWT secret, tokens ou configurações sensíveis de produção.

## 1. O que são variáveis de ambiente?

Variáveis de ambiente são valores configurados fora do código-fonte.

Elas permitem que o mesmo backend rode em ambientes diferentes, como:

- desenvolvimento local;
- produção no Render;
- banco Supabase;
- frontend local;
- frontend publicado na Vercel.

Exemplo:

```env
DATABASE_PASSWORD=sua_senha
JWT_SECRET=sua_chave_segura