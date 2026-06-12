package com.mapaeleitoral.publico.service;

import com.mapaeleitoral.apoiador.entity.Apoiador;
import com.mapaeleitoral.apoiador.enums.OrigemCadastro;
import com.mapaeleitoral.apoiador.enums.StatusApoiador;
import com.mapaeleitoral.apoiador.repository.ApoiadorRepository;
import com.mapaeleitoral.auditoria.service.AuditoriaService;
import com.mapaeleitoral.candidato.entity.Candidato;
import com.mapaeleitoral.candidato.entity.LinkCandidato;
import com.mapaeleitoral.candidato.repository.LinkCandidatoRepository;
import com.mapaeleitoral.consentimento.entity.ConsentimentoApoiador;
import com.mapaeleitoral.consentimento.entity.TermoConsentimento;
import com.mapaeleitoral.consentimento.repository.ConsentimentoApoiadorRepository;
import com.mapaeleitoral.consentimento.repository.TermoConsentimentoRepository;
import com.mapaeleitoral.publico.dto.CadastroApoiadorPublicoRequest;
import com.mapaeleitoral.publico.dto.CadastroApoiadorPublicoResponse;
import com.mapaeleitoral.publico.dto.LinkPublicoResponse;
import com.mapaeleitoral.usuario.entity.Usuario;
import com.mapaeleitoral.usuario.enums.PapelUsuario;
import com.mapaeleitoral.usuario.repository.UsuarioRepository;
import com.mapaeleitoral.usuario.service.TituloEleitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Serviço responsável pelas rotas públicas.
 *
 * Segurança/LGPD:
 * - O título de eleitor completo nunca é salvo.
 * - O cadastro por convite usa apenas o responsável do link para montar a hierarquia.
 */
@Service
@RequiredArgsConstructor
public class PublicoService {

    private final LinkCandidatoRepository linkCandidatoRepository;
    private final ApoiadorRepository apoiadorRepository;
    private final TermoConsentimentoRepository termoConsentimentoRepository;
    private final ConsentimentoApoiadorRepository consentimentoApoiadorRepository;
    private final AuditoriaService auditoriaService;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final TituloEleitorService tituloEleitorService;

    @Transactional(readOnly = true)
    public LinkPublicoResponse buscarLinkPorCodigo(String codigo) {
        LinkCandidato link = linkCandidatoRepository.findByCodigo(codigo)
                .orElseThrow(() -> new RuntimeException("Link de cadastro não encontrado."));

        if (!Boolean.TRUE.equals(link.getAtivo())) {
            throw new RuntimeException("Link de cadastro inativo.");
        }

        Candidato candidato = link.getCandidato();

        if (candidato == null || !Boolean.TRUE.equals(candidato.getAtivo())) {
            throw new RuntimeException("Rede vinculada inativa.");
        }

        Usuario responsavel = link.getResponsavel();

        if (responsavel == null || !Boolean.TRUE.equals(responsavel.getAtivo())) {
            throw new RuntimeException("Responsável pelo convite indisponível.");
        }

        return LinkPublicoResponse.builder()
                .codigo(link.getCodigo())
                .ativo(link.getAtivo())
                .candidatoId(candidato.getId())
                .nomePublico(candidato.getNomePublico())
                .partido(candidato.getPartido())
                .numeroUrna(candidato.getNumeroUrna())
                .cargoPretendido(candidato.getCargoPretendido())
                .municipioBase(candidato.getMunicipioBase())
                .build();
    }

    @Transactional
    public CadastroApoiadorPublicoResponse cadastrarApoiador(CadastroApoiadorPublicoRequest request) {
        if (!Boolean.TRUE.equals(request.getConsentimentoAceito())) {
            throw new RuntimeException("É necessário aceitar o termo de consentimento.");
        }

        if (!request.getSenha().equals(request.getConfirmacaoSenha())) {
            throw new RuntimeException("A senha e a confirmação de senha não conferem.");
        }

        TituloEleitorService.TituloProcessado tituloProcessado =
                tituloEleitorService.processar(request.getTituloEleitor());

        if (usuarioRepository.existsByTituloEleitorHash(tituloProcessado.hash())) {
            throw new RuntimeException("Já existe um cadastro vinculado a este título.");
        }

        String emailNormalizado = request.getEmail().trim().toLowerCase();

        if (usuarioRepository.existsByEmail(emailNormalizado)) {
            throw new RuntimeException("Já existe uma conta cadastrada com este e-mail.");
        }

        LinkCandidato link = linkCandidatoRepository.findByCodigo(request.getCodigoLink())
                .orElseThrow(() -> new RuntimeException("Link de cadastro não encontrado."));

        if (!Boolean.TRUE.equals(link.getAtivo())) {
            throw new RuntimeException("Link de cadastro inativo.");
        }

        Candidato candidato = link.getCandidato();

        if (candidato == null || !Boolean.TRUE.equals(candidato.getAtivo())) {
            throw new RuntimeException("Rede vinculada inativa.");
        }

        Usuario responsavel = link.getResponsavel();

        if (responsavel == null || responsavel.getPapel() == null) {
            throw new RuntimeException("Responsável pelo convite não encontrado.");
        }

        if (!Boolean.TRUE.equals(responsavel.getAtivo())) {
            throw new RuntimeException("Responsável pelo convite indisponível.");
        }

        Usuario admRaiz = resolverAdmRaizDoConvite(responsavel);

        TermoConsentimento termo = termoConsentimentoRepository.findFirstByAtivoTrueOrderByCriadoEmDesc()
                .orElseThrow(() -> new RuntimeException("Nenhum termo de consentimento ativo encontrado."));

        LocalDateTime agora = LocalDateTime.now();

        Usuario usuarioApoiador = Usuario.builder()
                .nome(request.getNome().trim())
                .email(emailNormalizado)
                .telefone(request.getTelefone().trim())
                .senhaHash(passwordEncoder.encode(request.getSenha()))
                .papel(PapelUsuario.USUARIO)
                .tituloEleitorHash(tituloProcessado.hash())
                .tituloEleitorUltimos4(tituloProcessado.ultimos4())
                .superior(responsavel)
                .admRaiz(admRaiz)
                .fotoUrl(null)
                .ativo(true)
                .criadoEm(agora)
                .atualizadoEm(agora)
                .build();

        Usuario usuarioApoiadorSalvo = usuarioRepository.save(usuarioApoiador);

        Apoiador apoiador = Apoiador.builder()
                .usuario(usuarioApoiadorSalvo)
                .candidato(candidato)
                .nome(request.getNome().trim())
                .email(emailNormalizado)
                .telefone(request.getTelefone().trim())
                .municipio(request.getMunicipio().trim())
                .bairro(request.getBairro().trim())
                .zonaEleitoral(request.getZonaEleitoral())
                .secaoEleitoral(request.getSecaoEleitoral())
                .observacao(normalizarTextoOpcional(request.getObservacao()))
                .status(StatusApoiador.ATIVO)
                .origemCadastro(OrigemCadastro.LINK_CANDIDATO)
                .consentimentoAceito(true)
                .consentimentoData(agora)
                .ativo(true)
                .criadoEm(agora)
                .atualizadoEm(agora)
                .build();

        Apoiador apoiadorSalvo = apoiadorRepository.save(apoiador);

        ConsentimentoApoiador consentimento = ConsentimentoApoiador.builder()
                .apoiador(apoiadorSalvo)
                .termo(termo)
                .aceitoEm(agora)
                .ipOrigem(null)
                .userAgent(null)
                .build();

        consentimentoApoiadorRepository.save(consentimento);

        auditoriaService.registrarSistema(
                "USUARIO_PUBLICO_CADASTRADO",
                "Usuário cadastrado publicamente por convite."
        );

        return CadastroApoiadorPublicoResponse.builder()
                .id(apoiadorSalvo.getId())
                .nome(apoiadorSalvo.getNome())
                .candidatoNome(candidato.getNomePublico())
                .municipio(apoiadorSalvo.getMunicipio())
                .zonaEleitoral(apoiadorSalvo.getZonaEleitoral())
                .secaoEleitoral(apoiadorSalvo.getSecaoEleitoral())
                .status(apoiadorSalvo.getStatus().name())
                .mensagem("Cadastro realizado com sucesso.")
                .build();
    }

    private Usuario resolverAdmRaizDoConvite(Usuario responsavel) {
        if (responsavel.getPapel() == PapelUsuario.ADM) {
            return responsavel;
        }

        if (responsavel.getPapel() == PapelUsuario.LIDER) {
            Usuario admRaiz = responsavel.getAdmRaiz();

            if (admRaiz == null) {
                throw new RuntimeException("ADM raiz do convite não encontrado.");
            }

            return admRaiz;
        }

        throw new RuntimeException("Responsável pelo convite inválido.");
    }

    private String normalizarTextoOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }

        return valor.trim();
    }
}