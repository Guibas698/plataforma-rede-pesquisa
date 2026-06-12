package com.mapaeleitoral.apoiador.service;

import com.mapaeleitoral.apoiador.dto.ApoiadorAlterarSenhaRequest;
import com.mapaeleitoral.apoiador.dto.ApoiadorAtualizarPerfilRequest;
import com.mapaeleitoral.apoiador.dto.ApoiadorMeResponse;
import com.mapaeleitoral.apoiador.entity.Apoiador;
import com.mapaeleitoral.apoiador.repository.ApoiadorRepository;
import com.mapaeleitoral.auditoria.service.AuditoriaService;
import com.mapaeleitoral.candidato.entity.Candidato;
import com.mapaeleitoral.usuario.entity.Usuario;
import com.mapaeleitoral.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

/**
 * Serviço responsável pelas regras de negócio do usuário logado.
 *
 * Observação de segurança/LGPD:
 * O usuário só pode acessar e alterar o próprio perfil.
 * O vínculo principal, consentimento, origem de cadastro e status
 * não podem ser alterados pelo próprio usuário neste MVP.
 */
@Service
@RequiredArgsConstructor
public class ApoiadorService {

    private final UsuarioRepository usuarioRepository;
    private final ApoiadorRepository apoiadorRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;

    @Transactional(readOnly = true)
    public ApoiadorMeResponse obterMe() {
        Apoiador apoiador = obterApoiadorLogado();
        return montarApoiadorMeResponse(apoiador);
    }

    @Transactional
    public ApoiadorMeResponse atualizarPerfil(ApoiadorAtualizarPerfilRequest request) {
        Usuario usuario = obterUsuarioLogado();
        Apoiador apoiador = obterApoiadorLogado();

        LocalDateTime agora = LocalDateTime.now();

        String emailAtualizado = resolverEmailAtualizado(request.getEmail(), usuario);

        usuario.setNome(request.getNome().trim());
        usuario.setEmail(emailAtualizado);
        usuario.setTelefone(request.getTelefone().trim());
        usuario.setAtualizadoEm(agora);

        apoiador.setNome(request.getNome().trim());
        apoiador.setEmail(emailAtualizado);
        apoiador.setTelefone(request.getTelefone().trim());
        apoiador.setMunicipio(request.getMunicipio().trim());
        apoiador.setBairro(request.getBairro().trim());
        apoiador.setZonaEleitoral(request.getZonaEleitoral());
        apoiador.setSecaoEleitoral(request.getSecaoEleitoral());
        apoiador.setObservacao(normalizarTextoOpcional(request.getObservacao()));
        apoiador.setAtualizadoEm(agora);

        /*
         * Segurança/LGPD:
         * Não alterar aqui:
         * - vínculo principal
         * - superior direto
         * - ADM raiz
         * - consentimentoAceito
         * - consentimentoData
         * - origemCadastro
         * - status
         */

        usuarioRepository.save(usuario);
        Apoiador apoiadorSalvo = apoiadorRepository.save(apoiador);

        auditoriaService.registrar(
                "PERFIL_USUARIO_ATUALIZADO",
                "Usuário atualizou o próprio perfil."
        );

        return montarApoiadorMeResponse(apoiadorSalvo);
    }

    @Transactional
    public void alterarSenha(ApoiadorAlterarSenhaRequest request) {
        Usuario usuario = obterUsuarioLogado();

        if (!request.getNovaSenha().equals(request.getConfirmacaoNovaSenha())) {
            throw new RuntimeException("Nova senha e confirmação não conferem.");
        }

        if (!passwordEncoder.matches(request.getSenhaAtual(), usuario.getSenhaHash())) {
            throw new RuntimeException("Senha atual incorreta.");
        }

        usuario.setSenhaHash(passwordEncoder.encode(request.getNovaSenha()));
        usuario.setAtualizadoEm(LocalDateTime.now());

        usuarioRepository.save(usuario);

        auditoriaService.registrar(
                "SENHA_USUARIO_ALTERADA",
                "Usuário alterou a própria senha."
        );
    }

    private Usuario obterUsuarioLogado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Usuário não autenticado.");
        }

        String email = authentication.getName();

        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));
    }

    private Apoiador obterApoiadorLogado() {
        Usuario usuario = obterUsuarioLogado();

        return apoiadorRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado para esta conta."));
    }

    private ApoiadorMeResponse montarApoiadorMeResponse(Apoiador apoiador) {
        Usuario usuario = apoiador.getUsuario();
        Candidato candidato = apoiador.getCandidato();

        Usuario superior = usuario != null ? usuario.getSuperior() : null;
        Usuario admRaiz = usuario != null ? usuario.getAdmRaiz() : null;

        return ApoiadorMeResponse.builder()
                .id(apoiador.getId())
                .usuarioId(usuario != null ? usuario.getId() : null)
                .nome(apoiador.getNome())
                .email(apoiador.getEmail())
                .telefone(apoiador.getTelefone())
                .fotoUrl(usuario != null ? usuario.getFotoUrl() : null)
                .municipio(apoiador.getMunicipio())
                .bairro(apoiador.getBairro())
                .zonaEleitoral(apoiador.getZonaEleitoral())
                .secaoEleitoral(apoiador.getSecaoEleitoral())
                .observacao(apoiador.getObservacao())
                .status(apoiador.getStatus() != null ? apoiador.getStatus().name() : null)
                .origemCadastro(apoiador.getOrigemCadastro() != null ? apoiador.getOrigemCadastro().name() : null)
                .consentimentoAceito(apoiador.getConsentimentoAceito())
                .consentimentoData(apoiador.getConsentimentoData())
                .ativo(apoiador.getAtivo())
                .criadoEm(apoiador.getCriadoEm())
                .candidatoId(candidato != null ? candidato.getId() : null)
                .candidatoNomePublico(candidato != null ? candidato.getNomePublico() : null)
                .candidatoPartido(candidato != null ? candidato.getPartido() : null)
                .candidatoNumeroUrna(candidato != null ? candidato.getNumeroUrna() : null)
                .candidatoCargoPretendido(candidato != null ? candidato.getCargoPretendido() : null)
                .candidatoMunicipioBase(candidato != null ? candidato.getMunicipioBase() : null)
                .superiorId(superior != null ? superior.getId() : null)
                .superiorNome(superior != null ? superior.getNome() : null)
                .superiorPapel(
                        superior != null && superior.getPapel() != null
                                ? superior.getPapel().name()
                                : null
                )
                .admRaizId(admRaiz != null ? admRaiz.getId() : null)
                .admRaizNome(admRaiz != null ? admRaiz.getNome() : null)
                .tituloEleitorUltimos4(usuario != null ? usuario.getTituloEleitorUltimos4() : null)
                .build();
    }

    private String resolverEmailAtualizado(String emailRequest, Usuario usuario) {
        if (emailRequest == null || emailRequest.isBlank()) {
            return usuario.getEmail();
        }

        String emailNormalizado = emailRequest.trim().toLowerCase(Locale.ROOT);

        if (!emailNormalizado.equals(usuario.getEmail()) && usuarioRepository.existsByEmail(emailNormalizado)) {
            throw new RuntimeException("E-mail já cadastrado.");
        }

        return emailNormalizado;
    }

    private String normalizarTextoOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }

        return valor.trim();
    }
}