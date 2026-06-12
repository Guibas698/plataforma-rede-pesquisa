package com.mapaeleitoral.auditoria.service;

import com.mapaeleitoral.auditoria.entity.AuditoriaEvento;
import com.mapaeleitoral.auditoria.repository.AuditoriaEventoRepository;
import com.mapaeleitoral.usuario.entity.Usuario;
import com.mapaeleitoral.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Serviço responsável por centralizar o registro de eventos de auditoria.
 *
 * Importante:
 * A auditoria nunca deve quebrar o fluxo principal da aplicação.
 * Por isso, todos os métodos capturam exceções internamente.
 */
@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private final AuditoriaEventoRepository auditoriaEventoRepository;
    private final UsuarioRepository usuarioRepository;

    /**
     * Registra um evento de auditoria tentando associar ao usuário autenticado.
     *
     * Use este método para ações feitas por usuários logados,
     * como criação de candidato, alteração de perfil, alteração de senha,
     * cadastro manual de apoiador, entre outros.
     */
    public void registrar(String tipoEvento, String descricao) {
        try {
            Usuario usuario = obterUsuarioLogadoOuNull();

            AuditoriaEvento evento = new AuditoriaEvento();
            evento.setUsuario(usuario);
            evento.setTipoEvento(tipoEvento);
            evento.setDescricao(descricao);
            evento.setIpOrigem(null);
            evento.setUserAgent(null);
            evento.setCriadoEm(LocalDateTime.now());

            auditoriaEventoRepository.save(evento);
        } catch (Exception ignored) {
            // A auditoria não deve interromper o fluxo principal da aplicação.
        }
    }

    /**
     * Registra um evento automático do sistema, sem usuário associado.
     *
     * Use este método para eventos gerados automaticamente,
     * como seeds, rotinas internas, integrações futuras ou tarefas agendadas.
     */
    public void registrarSistema(String tipoEvento, String descricao) {
        try {
            AuditoriaEvento evento = new AuditoriaEvento();
            evento.setUsuario(null);
            evento.setTipoEvento(tipoEvento);
            evento.setDescricao(descricao);
            evento.setIpOrigem(null);
            evento.setUserAgent(null);
            evento.setCriadoEm(LocalDateTime.now());

            auditoriaEventoRepository.save(evento);
        } catch (Exception ignored) {
            // A auditoria não deve interromper o fluxo principal da aplicação.
        }
    }

    private Usuario obterUsuarioLogadoOuNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null) {
            return null;
        }

        if (!authentication.isAuthenticated()) {
            return null;
        }

        String email = authentication.getName();

        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            return null;
        }

        return usuarioRepository.findByEmail(email).orElse(null);
    }
}