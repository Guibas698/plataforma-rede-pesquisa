package com.mapaeleitoral.candidato.service;

import com.mapaeleitoral.apoiador.entity.Apoiador;
import com.mapaeleitoral.apoiador.enums.OrigemCadastro;
import com.mapaeleitoral.apoiador.enums.StatusApoiador;
import com.mapaeleitoral.apoiador.repository.ApoiadorRepository;
import com.mapaeleitoral.auditoria.service.AuditoriaService;
import com.mapaeleitoral.candidato.dto.CandidatoAlterarSenhaRequest;
import com.mapaeleitoral.candidato.dto.CandidatoApoiadorResumoResponse;
import com.mapaeleitoral.candidato.dto.CandidatoAtualizarApoiadorRequest;
import com.mapaeleitoral.candidato.dto.CandidatoAtualizarPerfilRequest;
import com.mapaeleitoral.candidato.dto.CandidatoCriarApoiadorRequest;
import com.mapaeleitoral.candidato.dto.CandidatoDashboardResponse;
import com.mapaeleitoral.candidato.dto.CandidatoLinkResponse;
import com.mapaeleitoral.candidato.dto.CandidatoMapaMunicipioResponse;
import com.mapaeleitoral.candidato.dto.CandidatoMunicipioResumoResponse;
import com.mapaeleitoral.candidato.dto.CandidatoPerfilResponse;
import com.mapaeleitoral.candidato.entity.Candidato;
import com.mapaeleitoral.candidato.entity.LinkCandidato;
import com.mapaeleitoral.candidato.repository.CandidatoRepository;
import com.mapaeleitoral.candidato.repository.LinkCandidatoRepository;
import com.mapaeleitoral.usuario.entity.Usuario;
import com.mapaeleitoral.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.mapaeleitoral.candidato.dto.LiderPromovidoResponse;
import com.mapaeleitoral.usuario.enums.PapelUsuario;
import org.springframework.data.domain.PageImpl;
import com.mapaeleitoral.candidato.dto.RedeResumoResponse;
import com.mapaeleitoral.candidato.dto.RedeUsuarioNodeResponse;
import com.mapaeleitoral.usuario.service.TituloEleitorService;

import java.text.Normalizer;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Serviço responsável pelas regras de negócio dos endpoints do candidato logado.
 *
 * Observação de segurança/LGPD:
 * O candidato só pode acessar, atualizar ou remover apoiadores vinculados a ele.
 * Apoiadores de outros candidatos devem ser tratados como não encontrados.
 */
@Service
@RequiredArgsConstructor
public class CandidatoService {

    private static final String URL_FRONTEND_CADASTRO = "http://localhost:3000/cadastro/";

    private final UsuarioRepository usuarioRepository;
    private final CandidatoRepository candidatoRepository;
    private final LinkCandidatoRepository linkCandidatoRepository;
    private final ApoiadorRepository apoiadorRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;
    private final TituloEleitorService tituloEleitorService;

    @Transactional(readOnly = true)
    public CandidatoDashboardResponse obterDashboard() {
        Usuario usuarioLogado = obterUsuarioLogado();
        Candidato candidato = obterCandidatoDaRede(usuarioLogado);
        List<Apoiador> apoiadores = buscarApoiadoresVisiveisParaUsuario(usuarioLogado, candidato);

        LocalDate hoje = LocalDate.now();
        LocalDateTime agora = LocalDateTime.now();
        LocalDateTime inicioUltimosSeteDias = agora.minusDays(7);
        LocalDateTime inicioQuatorzeDias = agora.minusDays(14);

        Long totalApoiadores = (long) apoiadores.size();
        Long municipiosAlcancados = contarMunicipios(apoiadores);
        Long zonasEleitorais = contarZonas(apoiadores);
        Long secoesEleitorais = contarSecoes(apoiadores);

        Long cadastrosHoje = apoiadores.stream()
                .filter(apoiador -> apoiador.getCriadoEm() != null)
                .filter(apoiador -> apoiador.getCriadoEm().toLocalDate().equals(hoje))
                .count();

        Long cadastrosUltimosSeteDias = apoiadores.stream()
                .filter(apoiador -> apoiador.getCriadoEm() != null)
                .filter(apoiador -> !apoiador.getCriadoEm().isBefore(inicioUltimosSeteDias))
                .count();

        Long cadastrosSeteDiasAnteriores = apoiadores.stream()
                .filter(apoiador -> apoiador.getCriadoEm() != null)
                .filter(apoiador -> !apoiador.getCriadoEm().isBefore(inicioQuatorzeDias))
                .filter(apoiador -> apoiador.getCriadoEm().isBefore(inicioUltimosSeteDias))
                .count();

        Double crescimentoPercentual = calcularCrescimentoPercentual(
                cadastrosUltimosSeteDias,
                cadastrosSeteDiasAnteriores
        );

        String linkCadastro = linkCandidatoRepository
                .findFirstByResponsavelIdAndAtivoTrue(usuarioLogado.getId())
                .map(LinkCandidato::getCodigo)
                .orElse(null);

        return CandidatoDashboardResponse.builder()
                .totalApoiadores(totalApoiadores)
                .municipiosAlcancados(municipiosAlcancados)
                .zonasEleitorais(zonasEleitorais)
                .secoesEleitorais(secoesEleitorais)
                .cadastrosHoje(cadastrosHoje)
                .cadastrosUltimosSeteDias(cadastrosUltimosSeteDias)
                .crescimentoPercentual(crescimentoPercentual)
                .linkCadastro(linkCadastro)
                .municipiosDestaque(montarMunicipiosDestaque(apoiadores))
                .build();
    }


@Transactional
public LiderPromovidoResponse promoverUsuarioParaLider(UUID usuarioId) {
    Usuario usuarioLogado = obterUsuarioLogado();

    validarUsuarioPodePromover(usuarioLogado);

    Usuario usuarioParaPromover = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

    validarUsuarioPodeSerPromovido(usuarioParaPromover);
    validarEscopoPromocao(usuarioLogado, usuarioParaPromover);
    validarUsuarioPossuiIdentificadorObrigatorio(usuarioParaPromover);

    Usuario admRaiz = usuarioParaPromover.getAdmRaiz();

    if (admRaiz == null || admRaiz.getId() == null) {
        throw new RuntimeException("Usuário não possui ADM raiz definido.");
    }

    Candidato candidatoRede = candidatoRepository.findByUsuarioId(admRaiz.getId())
            .orElseThrow(() -> new RuntimeException("ADM raiz não possui registro de rede configurado."));

    LocalDateTime agora = LocalDateTime.now();

    usuarioParaPromover.setPapel(PapelUsuario.LIDER);
    usuarioParaPromover.setAtualizadoEm(agora);

    Usuario liderSalvo = usuarioRepository.save(usuarioParaPromover);

    LinkCandidato linkLider = obterOuCriarLinkAtivoParaResponsavel(
            liderSalvo,
            candidatoRede
    );

    auditoriaService.registrar(
            "USUARIO_PROMOVIDO_LIDER",
            "Usuário promovido para líder: " + liderSalvo.getNome()
    );

    Usuario superior = liderSalvo.getSuperior();
    Usuario admRaizSalvo = liderSalvo.getAdmRaiz();

    return LiderPromovidoResponse.builder()
            .usuarioId(liderSalvo.getId())
            .nome(liderSalvo.getNome())
            .email(liderSalvo.getEmail())
            .telefone(liderSalvo.getTelefone())
            .papel(liderSalvo.getPapel().name())
            .superiorId(superior != null ? superior.getId() : null)
            .superiorNome(superior != null ? superior.getNome() : null)
            .admRaizId(admRaizSalvo != null ? admRaizSalvo.getId() : null)
            .admRaizNome(admRaizSalvo != null ? admRaizSalvo.getNome() : null)
            .codigoLink(linkLider.getCodigo())
            .mensagem("Usuário promovido para líder com sucesso.")
            .build();
}

@Transactional(readOnly = true)
public RedeResumoResponse obterRede() {
    Usuario usuarioLogado = obterUsuarioLogado();

    if (usuarioLogado.getPapel() != PapelUsuario.ADM && usuarioLogado.getPapel() != PapelUsuario.LIDER) {
        throw new RuntimeException("Usuário sem permissão para visualizar rede.");
    }

    List<Usuario> filhosDiretos = usuarioRepository.findBySuperiorId(usuarioLogado.getId())
            .stream()
            .filter(filho -> pertenceAoEscopoDaRede(usuarioLogado, filho))
            .toList();

    List<RedeUsuarioNodeResponse> arvore = filhosDiretos.stream()
            .map(filho -> montarNodeRede(usuarioLogado, filho))
            .toList();

    List<Usuario> descendentes = buscarDescendentesRecursivo(usuarioLogado);

    Long totalUsuarios = contarPorPapel(descendentes, PapelUsuario.USUARIO);
    Long totalLideres = contarPorPapel(descendentes, PapelUsuario.LIDER);

    auditoriaService.registrar(
            "REDE_VISUALIZADA",
            "Usuário visualizou sua rede em cascata."
    );

    return RedeResumoResponse.builder()
            .usuarioLogadoId(usuarioLogado.getId())
            .usuarioLogadoNome(usuarioLogado.getNome())
            .papelLogado(usuarioLogado.getPapel().name())
            .totalUsuarios(totalUsuarios)
            .totalLideres(totalLideres)
            .totalDiretos((long) filhosDiretos.size())
            .arvore(arvore)
            .build();
}

private RedeUsuarioNodeResponse montarNodeRede(Usuario usuarioLogado, Usuario usuario) {
    List<Usuario> filhos = usuarioRepository.findBySuperiorId(usuario.getId())
            .stream()
            .filter(filho -> pertenceAoEscopoDaRede(usuarioLogado, filho))
            .toList();

    List<RedeUsuarioNodeResponse> filhosResponse = filhos.stream()
            .map(filho -> montarNodeRede(usuarioLogado, filho))
            .toList();

    Usuario superior = usuario.getSuperior();
    Usuario admRaiz = usuario.getAdmRaiz();

    return RedeUsuarioNodeResponse.builder()
            .id(usuario.getId())
            .nome(usuario.getNome())
            .email(usuario.getEmail())
            .telefone(usuario.getTelefone())
            .papel(usuario.getPapel() != null ? usuario.getPapel().name() : null)
            .tituloEleitorUltimos4(usuario.getTituloEleitorUltimos4())
            .superiorId(superior != null ? superior.getId() : null)
            .superiorNome(superior != null ? superior.getNome() : null)
            .admRaizId(admRaiz != null ? admRaiz.getId() : null)
            .admRaizNome(admRaiz != null ? admRaiz.getNome() : null)
            .totalFilhos((long) filhos.size())
            .filhos(filhosResponse)
            .build();
}

private List<Usuario> buscarDescendentesRecursivo(Usuario usuario) {
    /*
     * TODO:
     * Para redes grandes, substituir por tabela de fechamento hierarquia_usuarios
     * ou por query recursiva WITH RECURSIVE.
     */
    List<Usuario> filhosDiretos = usuarioRepository.findBySuperiorId(usuario.getId());

    return filhosDiretos.stream()
            .flatMap(filho -> {
                List<Usuario> descendentesDoFilho = buscarDescendentesRecursivo(filho);

                return java.util.stream.Stream.concat(
                        java.util.stream.Stream.of(filho),
                        descendentesDoFilho.stream()
                );
            })
            .toList();
}

private Long contarPorPapel(List<Usuario> usuarios, PapelUsuario papel) {
    return usuarios.stream()
            .filter(usuario -> usuario.getPapel() == papel)
            .count();
}

private boolean pertenceAoEscopoDaRede(Usuario usuarioLogado, Usuario usuarioAvaliado) {
    if (usuarioLogado.getPapel() == PapelUsuario.ADM) {
        Usuario admRaiz = usuarioAvaliado.getAdmRaiz();

        return admRaiz != null
                && admRaiz.getId() != null
                && admRaiz.getId().equals(usuarioLogado.getId());
    }

    if (usuarioLogado.getPapel() == PapelUsuario.LIDER) {
        return estaAbaixoDoUsuario(usuarioLogado, usuarioAvaliado);
    }

    return false;
}

private boolean estaAbaixoDoUsuario(Usuario usuarioRaiz, Usuario usuarioAvaliado) {
    Usuario atual = usuarioAvaliado.getSuperior();

    while (atual != null) {
        if (atual.getId() != null && atual.getId().equals(usuarioRaiz.getId())) {
            return true;
        }

        atual = atual.getSuperior();
    }

    return false;
}

private void validarUsuarioPodePromover(Usuario usuarioLogado) {
    if (usuarioLogado.getPapel() == PapelUsuario.ADM || usuarioLogado.getPapel() == PapelUsuario.LIDER) {
        return;
    }

    throw new RuntimeException("Usuário não possui permissão para promover líderes.");
}

private void validarUsuarioPodeSerPromovido(Usuario usuarioParaPromover) {
    if (usuarioParaPromover.getPapel() == PapelUsuario.USUARIO) {
        return;
    }

    if (usuarioParaPromover.getPapel() == PapelUsuario.LIDER) {
        throw new RuntimeException("Usuário já é líder.");
    }

    throw new RuntimeException("Este usuário não pode ser promovido.");
}

private void validarUsuarioPossuiIdentificadorObrigatorio(Usuario usuario) {
    if (
            !textoValido(usuario.getTituloEleitorHash()) ||
            !textoValido(usuario.getTituloEleitorUltimos4())
    ) {
        throw new RuntimeException("Usuário não possui identificador obrigatório para ser promovido a líder.");
    }
}

private void validarEscopoPromocao(Usuario usuarioLogado, Usuario usuarioParaPromover) {
    if (usuarioLogado.getPapel() == PapelUsuario.ADM) {
        Usuario admRaiz = usuarioParaPromover.getAdmRaiz();

        if (
                admRaiz != null &&
                admRaiz.getId() != null &&
                admRaiz.getId().equals(usuarioLogado.getId())
        ) {
            return;
        }

        throw new RuntimeException("Usuário não pertence à sua rede.");
    }

    if (usuarioLogado.getPapel() == PapelUsuario.LIDER) {
        Usuario superior = usuarioParaPromover.getSuperior();

        if (
                superior != null &&
                superior.getId() != null &&
                superior.getId().equals(usuarioLogado.getId())
        ) {
            return;
        }

        throw new RuntimeException("Usuário não está diretamente abaixo deste líder.");
    }

    throw new RuntimeException("Usuário não possui permissão para promover líderes.");
}

private LinkCandidato obterOuCriarLinkAtivoParaResponsavel(
        Usuario responsavel,
        Candidato candidatoRede
) {
    return linkCandidatoRepository.findFirstByResponsavelIdAndAtivoTrue(responsavel.getId())
            .orElseGet(() -> {
                LinkCandidato novoLink = LinkCandidato.builder()
                        .candidato(candidatoRede)
                        .responsavel(responsavel)
                        .codigo(gerarCodigoLink(responsavel.getNome()))
                        .ativo(true)
                        .criadoEm(LocalDateTime.now())
                        .build();

                return linkCandidatoRepository.save(novoLink);
            });
}

private String gerarCodigoLink(String nomeResponsavel) {
    String slugBase = normalizarSlug(nomeResponsavel);

    if (!textoValido(slugBase)) {
        slugBase = "convite";
    }

    String codigo;

    do {
        String sufixo = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 5);

        codigo = slugBase + "-" + sufixo;
    } while (linkCandidatoRepository.existsByCodigo(codigo));

    return codigo;
}

private String normalizarSlug(String texto) {
    if (texto == null || texto.isBlank()) {
        return "convite";
    }

    String semAcentos = Normalizer.normalize(texto, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "");

    return semAcentos
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9\\s-]", "")
            .replaceAll("\\s+", "-")
            .replaceAll("-+", "-")
            .replaceAll("^-|-$", "");
}



@Transactional(readOnly = true)
public List<CandidatoMapaMunicipioResponse> obterMapa() {
    Usuario usuarioLogado = obterUsuarioLogado();

    if (usuarioLogado.getPapel() != PapelUsuario.ADM) {
        throw new RuntimeException("Mapa disponível apenas para ADMs.");
    }

    Candidato candidato = obterCandidatoDaRede(usuarioLogado);
    List<Apoiador> apoiadores = buscarApoiadoresVisiveisParaUsuario(usuarioLogado, candidato);

    return apoiadores.stream()
            .filter(apoiador -> textoValido(apoiador.getMunicipio()))
            .collect(Collectors.groupingBy(apoiador -> apoiador.getMunicipio().trim()))
            .entrySet()
            .stream()
            .map(entry -> CandidatoMapaMunicipioResponse.builder()
                    .municipio(entry.getKey())
                    .totalApoiadores((long) entry.getValue().size())
                    .zonasEleitorais(contarZonas(entry.getValue()))
                    .secoesEleitorais(contarSecoes(entry.getValue()))
                    .build())
            .sorted(Comparator.comparing(CandidatoMapaMunicipioResponse::getTotalApoiadores).reversed())
            .toList();
}

@Transactional(readOnly = true)
public Page<CandidatoApoiadorResumoResponse> listarApoiadores(int page, int size) {
    Usuario usuarioLogado = obterUsuarioLogado();
    Candidato candidatoRede = obterCandidatoDaRede(usuarioLogado);
    Pageable pageable = criarPageable(page, size);

    if (usuarioLogado.getPapel() == PapelUsuario.ADM) {
        return apoiadorRepository.findByCandidatoIdAndAtivoTrue(candidatoRede.getId(), pageable)
                .map(this::montarApoiadorResumo);
    }

    List<CandidatoApoiadorResumoResponse> usuariosVisiveis =
            buscarApoiadoresVisiveisParaUsuario(usuarioLogado, candidatoRede)
                    .stream()
                    .map(this::montarApoiadorResumo)
                    .toList();

    int inicio = (int) pageable.getOffset();

    if (inicio >= usuariosVisiveis.size()) {
        return new PageImpl<>(List.of(), pageable, usuariosVisiveis.size());
    }

    int fim = Math.min(inicio + pageable.getPageSize(), usuariosVisiveis.size());

    return new PageImpl<>(
            usuariosVisiveis.subList(inicio, fim),
            pageable,
            usuariosVisiveis.size()
    );
}

    @Transactional
    public CandidatoApoiadorResumoResponse criarApoiador(CandidatoCriarApoiadorRequest request) {
        Usuario usuarioLogado = obterUsuarioLogado();
        Candidato candidato = obterCandidatoDaRede(usuarioLogado);
        LocalDateTime agora = LocalDateTime.now();

        String nome = request.getNome().trim();
        String email = normalizarTextoOpcional(request.getEmail());
        String telefone = request.getTelefone().trim();

        TituloEleitorService.TituloProcessado tituloProcessado =
                tituloEleitorService.processar(request.getTituloEleitor());

        if (usuarioRepository.existsByTituloEleitorHash(tituloProcessado.hash())) {
            throw new RuntimeException("Já existe um cadastro vinculado a este título.");
        }


        if (!textoValido(email)) {
            throw new RuntimeException("E-mail é obrigatório para criar uma conta de usuário.");
        }

        if (usuarioRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Já existe um usuário cadastrado com este e-mail.");
        }

        if (!textoValido(request.getSenhaTemporaria()) || request.getSenhaTemporaria().trim().length() < 6) {
            throw new RuntimeException("A senha temporária deve ter no mínimo 6 caracteres.");
        }

        Usuario admRaiz;

        if (usuarioLogado.getPapel() == PapelUsuario.ADM) {
            admRaiz = usuarioLogado;
        } else if (usuarioLogado.getPapel() == PapelUsuario.LIDER) {
            admRaiz = usuarioLogado.getAdmRaiz();

            if (admRaiz == null || admRaiz.getId() == null) {
                throw new RuntimeException("Líder não possui ADM raiz definido.");
            }
        } else {
            throw new RuntimeException("Usuário não possui permissão para criar usuários.");
        }

        Usuario novoUsuario = Usuario.builder()
                .nome(nome)
                .email(email)
                .telefone(telefone)
                .senhaHash(passwordEncoder.encode(request.getSenhaTemporaria().trim()))
                .papel(PapelUsuario.USUARIO)
                .tituloEleitorHash(tituloProcessado.hash())
                .tituloEleitorUltimos4(tituloProcessado.ultimos4())
                .superior(usuarioLogado)
                .admRaiz(admRaiz)
                .ativo(true)
                .criadoEm(agora)
                .atualizadoEm(agora)
                .build();

        Usuario usuarioSalvo = usuarioRepository.save(novoUsuario);

        Apoiador apoiador = Apoiador.builder()
                .candidato(candidato)
                .usuario(usuarioSalvo)
                .nome(nome)
                .email(email)
                .telefone(telefone)
                .municipio(request.getMunicipio().trim())
                .bairro(request.getBairro().trim())
                .zonaEleitoral(request.getZonaEleitoral())
                .secaoEleitoral(request.getSecaoEleitoral())
                .observacao(normalizarTextoOpcional(request.getObservacao()))
                .status(StatusApoiador.ATIVO)
                .origemCadastro(OrigemCadastro.CADASTRO_MANUAL)
                .consentimentoAceito(false)
                .consentimentoData(null)
                .ativo(true)
                .criadoEm(agora)
                .atualizadoEm(agora)
                .build();

        Apoiador apoiadorSalvo = apoiadorRepository.save(apoiador);

        auditoriaService.registrar(
                "USUARIO_CRIADO_PELO_PAINEL",
                "Usuário com conta criado manualmente pelo painel."
        );

        return montarApoiadorResumo(apoiadorSalvo);
    }

    @Transactional
    public CandidatoApoiadorResumoResponse atualizarApoiador(
            UUID apoiadorId,
            CandidatoAtualizarApoiadorRequest request
    ) {
        Candidato candidato = obterCandidatoLogado();

        Apoiador apoiador = apoiadorRepository.findById(apoiadorId)
                .orElseThrow(() -> new RuntimeException("Apoiador não encontrado para este candidato."));

        validarApoiadorPertenceAoCandidato(apoiador, candidato);

        StatusApoiador status = converterStatusApoiador(request.getStatus());

        apoiador.setNome(request.getNome().trim());
        apoiador.setEmail(normalizarTextoOpcional(request.getEmail()));
        apoiador.setTelefone(request.getTelefone().trim());
        apoiador.setMunicipio(request.getMunicipio().trim());
        apoiador.setBairro(request.getBairro().trim());
        apoiador.setZonaEleitoral(request.getZonaEleitoral());
        apoiador.setSecaoEleitoral(request.getSecaoEleitoral());
        apoiador.setObservacao(normalizarTextoOpcional(request.getObservacao()));
        apoiador.setStatus(status);
        apoiador.setAtualizadoEm(LocalDateTime.now());

        Apoiador apoiadorSalvo = apoiadorRepository.save(apoiador);

        auditoriaService.registrar(
                "APOIADOR_ATUALIZADO_PELO_CANDIDATO",
                "Apoiador atualizado pelo candidato."
        );

        return montarApoiadorResumo(apoiadorSalvo);
    }

    @Transactional
    public void removerApoiador(UUID apoiadorId) {
        Candidato candidato = obterCandidatoLogado();

        Apoiador apoiador = apoiadorRepository.findById(apoiadorId)
                .orElseThrow(() -> new RuntimeException("Apoiador não encontrado para este candidato."));

        validarApoiadorPertenceAoCandidato(apoiador, candidato);

        apoiador.setAtivo(false);
        apoiador.setAtualizadoEm(LocalDateTime.now());

        apoiadorRepository.save(apoiador);

        auditoriaService.registrar(
                "APOIADOR_REMOVIDO_PELO_CANDIDATO",
                "Apoiador removido pelo candidato."
        );
    }

 @Transactional(readOnly = false)
public CandidatoLinkResponse obterLink() {
    Usuario usuarioLogado = obterUsuarioLogado();
    Candidato candidatoRede = obterCandidatoDaRede(usuarioLogado);
    List<Apoiador> apoiadores = buscarApoiadoresVisiveisParaUsuario(usuarioLogado, candidatoRede);

    LocalDate hoje = LocalDate.now();
    LocalDateTime inicioUltimosSeteDias = LocalDateTime.now().minusDays(7);

    LinkCandidato linkAtivo = obterOuCriarLinkAtivoParaResponsavel(
            usuarioLogado,
            candidatoRede
    );

    String codigo = linkAtivo.getCodigo();
    String urlCompleta = URL_FRONTEND_CADASTRO + codigo;

    Long cadastrosHoje = apoiadores.stream()
            .filter(apoiador -> apoiador.getCriadoEm() != null)
            .filter(apoiador -> apoiador.getCriadoEm().toLocalDate().equals(hoje))
            .count();

    Long cadastrosUltimosSeteDias = apoiadores.stream()
            .filter(apoiador -> apoiador.getCriadoEm() != null)
            .filter(apoiador -> !apoiador.getCriadoEm().isBefore(inicioUltimosSeteDias))
            .count();

    return CandidatoLinkResponse.builder()
            .codigo(codigo)
            .urlCompleta(urlCompleta)
            .ativo(linkAtivo.getAtivo())
            .totalApoiadores((long) apoiadores.size())
            .cadastrosHoje(cadastrosHoje)
            .municipiosAlcancados(contarMunicipios(apoiadores))
            .cadastrosUltimosSeteDias(cadastrosUltimosSeteDias)
            .build();
}


private Candidato obterCandidatoDaRede(Usuario usuario) {
    if (usuario.getPapel() == PapelUsuario.ADM) {
        return candidatoRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Rede não encontrada para o ADM logado."));
    }

    if (usuario.getPapel() == PapelUsuario.LIDER) {
        Usuario admRaiz = usuario.getAdmRaiz();

        if (admRaiz == null || admRaiz.getId() == null) {
            throw new RuntimeException("Líder não possui ADM raiz definido.");
        }

        return candidatoRepository.findByUsuarioId(admRaiz.getId())
                .orElseThrow(() -> new RuntimeException("Rede não encontrada para o líder logado."));
    }

    throw new RuntimeException("Usuário não possui permissão para acessar esta área.");
}

private List<Apoiador> buscarApoiadoresVisiveisParaUsuario(
        Usuario usuarioLogado,
        Candidato candidatoRede
) {
    List<Apoiador> apoiadores = buscarApoiadoresAtivosDoCandidato(candidatoRede);

    if (usuarioLogado.getPapel() == PapelUsuario.ADM) {
        return apoiadores;
    }

    if (usuarioLogado.getPapel() == PapelUsuario.LIDER) {
        return apoiadores.stream()
                .filter(apoiador -> apoiador.getUsuario() != null)
                .filter(apoiador -> estaAbaixoDoUsuario(usuarioLogado, apoiador.getUsuario()))
                .toList();
    }

    return List.of();
}

    @Transactional(readOnly = true)
    public CandidatoPerfilResponse obterPerfil() {
        Usuario usuarioLogado = obterUsuarioLogado();

        if (usuarioLogado.getPapel() == PapelUsuario.LIDER) {
            return montarPerfilUsuarioLider(usuarioLogado);
        }

        Candidato candidato = obterCandidatoLogado();
        return montarPerfil(candidato);
    }

        @Transactional
    public CandidatoPerfilResponse atualizarPerfil(CandidatoAtualizarPerfilRequest request) {
        Usuario usuarioLogado = obterUsuarioLogado();
        LocalDateTime agora = LocalDateTime.now();

        if (usuarioLogado.getPapel() == PapelUsuario.LIDER) {
            usuarioLogado.setNome(request.getNomeCompleto().trim());
            usuarioLogado.setTelefone(request.getTelefone().trim());
            usuarioLogado.setAtualizadoEm(agora);

            Usuario usuarioSalvo = usuarioRepository.save(usuarioLogado);

            auditoriaService.registrar(
                    "PERFIL_LIDER_ATUALIZADO",
                    "Líder atualizou o próprio perfil."
            );

            return montarPerfilUsuarioLider(usuarioSalvo);
        }

        Candidato candidato = obterCandidatoLogado();
        Usuario usuario = candidato.getUsuario();

        usuario.setNome(request.getNomeCompleto().trim());
        usuario.setTelefone(request.getTelefone().trim());
        usuario.setAtualizadoEm(agora);

        candidato.setNomePublico(request.getNomePublico().trim());
        candidato.setMunicipioBase(request.getMunicipioBase().trim());
        candidato.setPartido(normalizarTextoOpcionalOuVazio(request.getPartido()));
        candidato.setNumeroUrna(normalizarTextoOpcionalOuVazio(request.getNumeroUrna()));
        candidato.setCargoPretendido(request.getCargoPretendido().trim());
        candidato.setObservacaoInterna(normalizarTextoOpcional(request.getObservacaoInterna()));
        candidato.setAtualizadoEm(agora);

        usuarioRepository.save(usuario);
        Candidato candidatoSalvo = candidatoRepository.save(candidato);

        auditoriaService.registrar(
                "PERFIL_CANDIDATO_ATUALIZADO",
                "ADM atualizou o próprio perfil."
        );

        return montarPerfil(candidatoSalvo);
    }
    private CandidatoPerfilResponse montarPerfil(Candidato candidato) {
        Usuario usuario = candidato.getUsuario();

        return CandidatoPerfilResponse.builder()
                .id(candidato.getId())
                .usuarioId(usuario.getId())
                .nomeCompleto(usuario.getNome())
                .nomePublico(candidato.getNomePublico())
                .email(usuario.getEmail())
                .telefone(usuario.getTelefone())
                .tituloEleitorUltimos4(usuario.getTituloEleitorUltimos4())
                .fotoUrl(usuario.getFotoUrl())
                .municipioBase(candidato.getMunicipioBase())
                .partido(candidato.getPartido())
                .numeroUrna(candidato.getNumeroUrna())
                .cargoPretendido(candidato.getCargoPretendido())
                .observacaoInterna(candidato.getObservacaoInterna())
                .ativo(candidato.getAtivo())
                .criadoEm(candidato.getCriadoEm())
                .build();
    }

    @Transactional
    public void alterarSenha(CandidatoAlterarSenhaRequest request) {
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

    private Candidato obterCandidatoLogado() {
        Usuario usuario = obterUsuarioLogado();

        return candidatoRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Candidato não encontrado para o usuário logado."));
    }

    private CandidatoApoiadorResumoResponse montarApoiadorResumo(Apoiador apoiador) {
        Usuario usuario = apoiador.getUsuario();
        Usuario superior = usuario != null ? usuario.getSuperior() : null;
        Usuario admRaiz = usuario != null ? usuario.getAdmRaiz() : null;

        return CandidatoApoiadorResumoResponse.builder()
                .id(apoiador.getId())
                .usuarioId(usuario != null ? usuario.getId() : null)
                .nome(apoiador.getNome())
                .email(apoiador.getEmail())
                .telefone(apoiador.getTelefone())
                .municipio(apoiador.getMunicipio())
                .bairro(apoiador.getBairro())
                .zonaEleitoral(apoiador.getZonaEleitoral())
                .secaoEleitoral(apoiador.getSecaoEleitoral())
                .status(apoiador.getStatus() != null ? apoiador.getStatus().name() : null)
                .papelUsuario(usuario != null && usuario.getPapel() != null ? usuario.getPapel().name() : null)
                .superiorNome(superior != null ? superior.getNome() : null)
                .admRaizNome(admRaiz != null ? admRaiz.getNome() : null)
                .criadoEm(apoiador.getCriadoEm())
                .build();
    }

    private CandidatoPerfilResponse montarPerfilUsuarioLider(Usuario usuario) {
        return CandidatoPerfilResponse.builder()
                .id(null)
                .usuarioId(usuario.getId())
                .nomeCompleto(usuario.getNome())
                .nomePublico(usuario.getNome())
                .email(usuario.getEmail())
                .telefone(usuario.getTelefone())
                .tituloEleitorUltimos4(usuario.getTituloEleitorUltimos4())
                .fotoUrl(usuario.getFotoUrl())
                .municipioBase("")
                .partido("")
                .numeroUrna("")
                .cargoPretendido("Líder")
                .observacaoInterna(null)
                .ativo(usuario.getAtivo())
                .criadoEm(null)
                .build();
    }

    private void validarApoiadorPertenceAoCandidato(Apoiador apoiador, Candidato candidato) {
        if (
                apoiador.getCandidato() == null ||
                apoiador.getCandidato().getId() == null ||
                !apoiador.getCandidato().getId().equals(candidato.getId()) ||
                !Boolean.TRUE.equals(apoiador.getAtivo())
        ) {
            throw new RuntimeException("Apoiador não encontrado para este candidato.");
        }
    }

    private List<Apoiador> buscarApoiadoresAtivosDoCandidato(Candidato candidato) {
        return apoiadorRepository.findByCandidatoIdAndAtivoTrue(
                candidato.getId(),
                Pageable.unpaged()
        ).getContent();
    }

    private Optional<LinkCandidato> buscarLinkAtivoPrincipal(Candidato candidato) {
        return linkCandidatoRepository.findByCandidatoId(candidato.getId())
                .stream()
                .filter(link -> Boolean.TRUE.equals(link.getAtivo()))
                .findFirst();
    }

    private List<CandidatoMunicipioResumoResponse> montarMunicipiosDestaque(List<Apoiador> apoiadores) {
        return apoiadores.stream()
                .filter(apoiador -> textoValido(apoiador.getMunicipio()))
                .collect(Collectors.groupingBy(apoiador -> apoiador.getMunicipio().trim()))
                .entrySet()
                .stream()
                .map(this::montarMunicipioResumo)
                .sorted(Comparator.comparing(CandidatoMunicipioResumoResponse::getTotalApoiadores).reversed())
                .limit(5)
                .toList();
    }

    private CandidatoMunicipioResumoResponse montarMunicipioResumo(
            Map.Entry<String, List<Apoiador>> entry
    ) {
        List<Apoiador> apoiadores = entry.getValue();

        return CandidatoMunicipioResumoResponse.builder()
                .municipio(entry.getKey())
                .totalApoiadores((long) apoiadores.size())
                .zonasEleitorais(contarZonas(apoiadores))
                .secoesEleitorais(contarSecoes(apoiadores))
                .build();
    }

    private Long contarMunicipios(List<Apoiador> apoiadores) {
        return apoiadores.stream()
                .map(Apoiador::getMunicipio)
                .filter(this::textoValido)
                .map(this::normalizarComparacao)
                .distinct()
                .count();
    }

    private Long contarZonas(List<Apoiador> apoiadores) {
        return apoiadores.stream()
                .map(Apoiador::getZonaEleitoral)
                .filter(zona -> zona != null && zona > 0)
                .distinct()
                .count();
    }

    private Long contarSecoes(List<Apoiador> apoiadores) {
        return apoiadores.stream()
                .map(Apoiador::getSecaoEleitoral)
                .filter(secao -> secao != null && secao > 0)
                .distinct()
                .count();
    }

    private Double calcularCrescimentoPercentual(
            Long cadastrosUltimosSeteDias,
            Long cadastrosSeteDiasAnteriores
    ) {
        if (cadastrosSeteDiasAnteriores == null || cadastrosSeteDiasAnteriores == 0) {
            return cadastrosUltimosSeteDias != null && cadastrosUltimosSeteDias > 0
                    ? 100.0
                    : 0.0;
        }

        return ((cadastrosUltimosSeteDias - cadastrosSeteDiasAnteriores) * 100.0)
                / cadastrosSeteDiasAnteriores;
    }

    private StatusApoiador converterStatusApoiador(String status) {
        try {
            return StatusApoiador.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new RuntimeException("Status de apoiador inválido.");
        }
    }

    private Pageable criarPageable(int page, int size) {
        int paginaNormalizada = Math.max(page, 0);
        int tamanhoNormalizado = Math.min(Math.max(size, 1), 100);

        return PageRequest.of(
                paginaNormalizada,
                tamanhoNormalizado,
                Sort.by(Sort.Direction.DESC, "criadoEm")
        );
    }

    private String normalizarTextoOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }

        return valor.trim();
    }

    private String normalizarTextoOpcionalOuVazio(String valor) {
        if (valor == null || valor.isBlank()) {
            return "";
        }

        return valor.trim();
    }

    private String normalizarComparacao(String valor) {
        return valor.trim().toLowerCase(Locale.ROOT);
    }

    private boolean textoValido(String valor) {
        return valor != null && !valor.isBlank();
    }
}