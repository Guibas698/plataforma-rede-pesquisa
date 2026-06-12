package com.mapaeleitoral.usuario.enums;

/**
 * Representa os papéis de acesso disponíveis no sistema Rede Pesquisa.
 *
 * MASTER:
 * Usuário administrador principal, com acesso à área administrativa.
 *
 * ADM:
 * Administrador de uma rede. Substitui o antigo papel CANDIDATO.
 * Por compatibilidade, ainda acessa as rotas /api/candidato/**.
 *
 * LIDER:
 * Usuário promovido que poderá gerenciar uma subrede.
 * Nesta fase, acessa temporariamente as mesmas rotas do ADM.
 *
 * USUARIO:
 * Usuário final da plataforma. Substitui o antigo papel APOIADOR.
 * Por compatibilidade, ainda acessa as rotas /api/apoiador/**.
 */
public enum PapelUsuario {
    MASTER,
    ADM,
    LIDER,
    USUARIO
}