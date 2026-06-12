package com.mapaeleitoral.apoiador.enums;

/**
 * Representa a origem do cadastro do apoiador.
 *
 * LINK_CANDIDATO:
 * Cadastro realizado por meio do link público exclusivo de um candidato.
 * Nesse caso, o apoiador deve ser vinculado automaticamente ao candidato
 * dono do link.
 *
 * LINK_GERAL:
 * Cadastro realizado por meio de um link público geral do sistema,
 * sem necessariamente partir de um link exclusivo de candidato.
 *
 * CADASTRO_MANUAL:
 * Cadastro criado manualmente por um usuário autorizado, como Admin Master
 * ou, futuramente, pelo próprio candidato dentro das permissões definidas.
 */
public enum OrigemCadastro {
    LINK_CANDIDATO,
    LINK_GERAL,
    CADASTRO_MANUAL
}