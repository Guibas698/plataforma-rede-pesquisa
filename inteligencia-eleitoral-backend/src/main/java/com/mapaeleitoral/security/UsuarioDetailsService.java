package com.mapaeleitoral.security;

import com.mapaeleitoral.usuario.entity.Usuario;
import com.mapaeleitoral.usuario.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por carregar usuários da tabela usuarios
 * para o mecanismo de autenticação do Spring Security.
 *
 * Neste sistema, o username usado pelo Spring Security será o e-mail.
 */
@Service
public class UsuarioDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Usuário não encontrado com o e-mail: " + email
                ));

        String authority = "ROLE_" + usuario.getPapel().name();

        return User.builder()
                .username(usuario.getEmail())
                .password(usuario.getSenhaHash())
                .authorities(authority)
                .disabled(!Boolean.TRUE.equals(usuario.getAtivo()))
                .build();
    }
}