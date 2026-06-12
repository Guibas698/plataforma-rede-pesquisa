package com.mapaeleitoral.auth.service;

import com.mapaeleitoral.auditoria.service.AuditoriaService;
import com.mapaeleitoral.auth.dto.AlterarSenhaRequest;
import com.mapaeleitoral.auth.dto.LoginRequest;
import com.mapaeleitoral.auth.dto.LoginResponse;
import com.mapaeleitoral.auth.dto.UsuarioLogadoResponse;
import com.mapaeleitoral.security.JwtService;
import com.mapaeleitoral.usuario.entity.Usuario;
import com.mapaeleitoral.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço responsável pela autenticação.
 *
 * Segurança:
 * Nunca retornar senhaHash ou token além do JWT gerado no login.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final AuditoriaService auditoriaService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        email,
                        request.getSenha()
                )
        );

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new RuntimeException("Usuário inativo.");
        }

        String token = jwtService.gerarToken(usuario);

        auditoriaService.registrar(
                "LOGIN_REALIZADO",
                "Usuário realizou login: " + usuario.getEmail()
        );

        return LoginResponse.builder()
                .token(token)
                .usuarioId(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .papel(usuario.getPapel())
                .build();
    }

    @Transactional
    public UsuarioLogadoResponse obterUsuarioLogado() {
        Usuario usuario = buscarUsuarioAutenticado();

        Usuario superior = usuario.getSuperior();
        Usuario admRaiz = usuario.getAdmRaiz();

        return UsuarioLogadoResponse.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .telefone(usuario.getTelefone())
                .papel(usuario.getPapel())
                .fotoUrl(usuario.getFotoUrl())
                .ativo(usuario.getAtivo())
                .superiorId(superior != null ? superior.getId() : null)
                .superiorNome(superior != null ? superior.getNome() : null)
                .admRaizId(admRaiz != null ? admRaiz.getId() : null)
                .admRaizNome(admRaiz != null ? admRaiz.getNome() : null)
                .tituloEleitorUltimos4(usuario.getTituloEleitorUltimos4())
                .build();
    }

    @Transactional
    public void alterarSenha(AlterarSenhaRequest request) {
        validarAlteracaoSenha(request);

        Usuario usuario = buscarUsuarioAutenticado();

        boolean senhaAtualCorreta = passwordEncoder.matches(
                request.getSenhaAtual(),
                usuario.getSenhaHash()
        );

        if (!senhaAtualCorreta) {
            throw new RuntimeException("Senha atual incorreta.");
        }

        usuario.setSenhaHash(passwordEncoder.encode(request.getNovaSenha()));
        usuarioRepository.save(usuario);

        auditoriaService.registrar(
                "SENHA_ALTERADA",
                "Usuário alterou a própria senha: " + usuario.getEmail()
        );
    }

    private Usuario buscarUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Usuário não autenticado.");
        }

        String email = authentication.getName();

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new RuntimeException("Usuário inativo.");
        }

        return usuario;
    }

    private void validarAlteracaoSenha(AlterarSenhaRequest request) {
        if (request == null) {
            throw new RuntimeException("Dados para alteração de senha são obrigatórios.");
        }

        if (request.getSenhaAtual() == null || request.getSenhaAtual().isBlank()) {
            throw new RuntimeException("Senha atual é obrigatória.");
        }

        if (request.getNovaSenha() == null || request.getNovaSenha().isBlank()) {
            throw new RuntimeException("Nova senha é obrigatória.");
        }

        if (request.getConfirmacaoNovaSenha() == null || request.getConfirmacaoNovaSenha().isBlank()) {
            throw new RuntimeException("Confirmação da nova senha é obrigatória.");
        }

        if (request.getNovaSenha().length() < 6) {
            throw new RuntimeException("A nova senha deve ter pelo menos 6 caracteres.");
        }

        if (!request.getNovaSenha().equals(request.getConfirmacaoNovaSenha())) {
            throw new RuntimeException("Nova senha e confirmação não conferem.");
        }

        if (request.getSenhaAtual().equals(request.getNovaSenha())) {
            throw new RuntimeException("A nova senha deve ser diferente da senha atual.");
        }
    }
}