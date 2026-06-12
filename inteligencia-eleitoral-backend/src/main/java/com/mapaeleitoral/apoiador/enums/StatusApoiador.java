package com.mapaeleitoral.apoiador.enums;

/**
 * Representa o status operacional de um apoiador dentro do sistema.
 *
 * ATIVO:
 * Apoiador válido e ativo, podendo aparecer em listas, dashboards,
 * mapa e relatórios conforme as permissões do usuário logado.
 *
 * PENDENTE:
 * Apoiador cadastrado, mas ainda aguardando algum tipo de validação,
 * revisão ou confirmação futura.
 *
 * INATIVO:
 * Apoiador desativado. Seus dados podem ser mantidos para histórico,
 * auditoria e conformidade, mas ele não deve ser tratado como ativo
 * nas operações principais.
 */
public enum StatusApoiador {
    ATIVO,
    PENDENTE,
    INATIVO
}