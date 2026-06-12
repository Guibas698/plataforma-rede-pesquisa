package com.mapaeleitoral.admin.service;

import com.mapaeleitoral.admin.dto.AdminApoiadorResumoResponse;
import com.mapaeleitoral.admin.dto.AdminAtualizarCandidatoRequest;
import com.mapaeleitoral.admin.dto.AdminCandidatoDetalheResponse;
import com.mapaeleitoral.admin.dto.AdminCandidatoResumoResponse;
import com.mapaeleitoral.admin.dto.AdminCriarCandidatoRequest;
import com.mapaeleitoral.admin.dto.AdminDashboardResponse;
import com.mapaeleitoral.admin.dto.AdminRankingItemResponse;
import com.mapaeleitoral.admin.dto.AdminRelatorioResponse;
import com.mapaeleitoral.apoiador.entity.Apoiador;
import com.mapaeleitoral.candidato.entity.Candidato;
import com.mapaeleitoral.candidato.entity.LinkCandidato;
import com.mapaeleitoral.candidato.repository.CandidatoRepository;
import com.mapaeleitoral.candidato.repository.LinkCandidatoRepository;
import com.mapaeleitoral.apoiador.repository.ApoiadorRepository;
import com.mapaeleitoral.usuario.entity.Usuario;
import com.mapaeleitoral.usuario.enums.PapelUsuario;
import com.mapaeleitoral.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.mapaeleitoral.auditoria.service.AuditoriaService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.mapaeleitoral.admin.dto.AdminCrescimentoDiarioResponse;
import com.mapaeleitoral.usuario.service.TituloEleitorService;

import java.util.stream.IntStream;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Serviço responsável pelas regras de negócio do Admin Master.
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UsuarioRepository usuarioRepository;
    private final CandidatoRepository candidatoRepository;
    private final LinkCandidatoRepository linkCandidatoRepository;
    private final ApoiadorRepository apoiadorRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;
    private final TituloEleitorService tituloEleitorService;

    @Transactional(readOnly = true)
    public AdminDashboardResponse obterDashboard() {
        List<Candidato> candidatos = candidatoRepository.findAll();
        List<Apoiador> apoiadores = apoiadorRepository.findAll();

        LocalDate hoje = LocalDate.now();

        Long totalCandidatos = (long) candidatos.size();

        Long candidatosAtivos = candidatos.stream()
                .filter(candidato -> Boolean.TRUE.equals(candidato.getAtivo()))
                .count();

        Long totalApoiadores = (long) apoiadores.size();

        Long municipiosAlcancados = apoiadores.stream()
                .map(Apoiador::getMunicipio)
                .filter(this::textoValido)
                .map(this::normalizarComparacao)
                .distinct()
                .count();

        Long cadastrosHoje = apoiadores.stream()
                .filter(apoiador -> apoiador.getCriadoEm() != null)
                .filter(apoiador -> apoiador.getCriadoEm().toLocalDate().equals(hoje))
                .count();

        return AdminDashboardResponse.builder()
                .totalCandidatos(totalCandidatos)
                .candidatosAtivos(candidatosAtivos)
                .totalApoiadores(totalApoiadores)
                .municipiosAlcancados(municipiosAlcancados)
                .cadastrosHoje(cadastrosHoje)
                .build();
    }

    @Transactional(readOnly = true)
        public Page<AdminCandidatoResumoResponse> listarCandidatos(int page, int size) {
        Pageable pageable = criarPageable(page, size);

        return candidatoRepository.findAll(pageable)
                .map(this::montarAdminCandidatoResumoPaginado);
        }

    @Transactional(readOnly = true)
    public AdminCandidatoDetalheResponse buscarDetalhesCandidato(UUID id) {
        Candidato candidato = buscarCandidatoOuFalhar(id);
        return montarCandidatoDetalhe(candidato);
    }

    @Transactional
    public AdminCandidatoDetalheResponse criarCandidato(AdminCriarCandidatoRequest request) {
        String emailNormalizado = normalizarEmail(request.getEmail());

        if (usuarioRepository.existsByEmail(emailNormalizado)) {
            throw new RuntimeException("E-mail já cadastrado.");
        }


        TituloEleitorService.TituloProcessado tituloProcessado =
                tituloEleitorService.processar(request.getTituloEleitor());

        if (usuarioRepository.existsByTituloEleitorHash(tituloProcessado.hash())) {
        throw new RuntimeException("Já existe um cadastro vinculado a este título.");
        }

        LocalDateTime agora = LocalDateTime.now();

        Usuario usuario = Usuario.builder()
                .nome(request.getNomeCompleto().trim())
                .email(emailNormalizado)
                .telefone(request.getTelefone().trim())
                .senhaHash(passwordEncoder.encode(request.getSenhaInicial()))
                .papel(PapelUsuario.ADM)
                .tituloEleitorHash(tituloProcessado.hash())
                .tituloEleitorUltimos4(tituloProcessado.ultimos4())
                .ativo(true)
                .criadoEm(agora)
                .atualizadoEm(agora)
                .build();

        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        usuarioSalvo.setSuperior(null);
        usuarioSalvo.setAdmRaiz(usuarioSalvo);
        usuarioSalvo.setAtualizadoEm(agora);
        usuarioSalvo = usuarioRepository.save(usuarioSalvo);

        Candidato candidato = Candidato.builder()
                .usuario(usuarioSalvo)
                .nomePublico(request.getNomePublico().trim())
                .partido(normalizarTextoOpcionalOuVazio(request.getPartido()))
                .numeroUrna(normalizarTextoOpcionalOuVazio(request.getNumeroUrna()))
                .cargoPretendido(request.getCargoPretendido().trim())
                .municipioBase(request.getMunicipioBase().trim())
                .observacaoInterna(normalizarTextoOpcional(request.getObservacaoInterna()))
                .ativo(true)
                .criadoEm(agora)
                .atualizadoEm(agora)
                .build();

        Candidato candidatoSalvo = candidatoRepository.save(candidato);

        String codigoLink = gerarCodigoLink(candidatoSalvo.getNomePublico());

       LinkCandidato link = LinkCandidato.builder()
        .candidato(candidatoSalvo)
        .responsavel(usuarioSalvo)
        .codigo(codigoLink)
        .ativo(true)
        .criadoEm(agora)
        .build();

        linkCandidatoRepository.save(link);

        auditoriaService.registrar(
                "CANDIDATO_CRIADO",
                "Novo candidato criado: " + candidatoSalvo.getNomePublico()
        );

        return montarCandidatoDetalhe(candidatoSalvo);
    }

    @Transactional
    public AdminCandidatoDetalheResponse atualizarCandidato(
            UUID id,
            AdminAtualizarCandidatoRequest request
    ) {
        Candidato candidato = buscarCandidatoOuFalhar(id);
        Usuario usuario = candidato.getUsuario();

        LocalDateTime agora = LocalDateTime.now();

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
                "CANDIDATO_ATUALIZADO",
                "Candidato atualizado: " + candidatoSalvo.getNomePublico()
        );
        return montarCandidatoDetalhe(candidatoSalvo);
    }

    @Transactional
    public AdminCandidatoDetalheResponse alterarStatusCandidato(UUID id) {
        Candidato candidato = buscarCandidatoOuFalhar(id);
        Usuario usuario = candidato.getUsuario();

        boolean novoStatus = !Boolean.TRUE.equals(candidato.getAtivo());
        LocalDateTime agora = LocalDateTime.now();

        candidato.setAtivo(novoStatus);
        candidato.setAtualizadoEm(agora);

        usuario.setAtivo(novoStatus);
        usuario.setAtualizadoEm(agora);

        usuarioRepository.save(usuario);
        Candidato candidatoSalvo = candidatoRepository.save(candidato);

        auditoriaService.registrar(
                "CANDIDATO_STATUS_ALTERADO",
                "Status do candidato alterado: " + candidatoSalvo.getNomePublico()
        );

        return montarCandidatoDetalhe(candidatoSalvo);
    }

    @Transactional(readOnly = true)
        public Page<AdminApoiadorResumoResponse> listarApoiadores(int page, int size) {
        Pageable pageable = criarPageable(page, size);

        return apoiadorRepository.findAll(pageable)
                .map(this::montarAdminApoiadorResumoPaginado);
        }

        @Transactional(readOnly = true)
public AdminRelatorioResponse obterRelatorio() {
    List<Candidato> candidatos = candidatoRepository.findAll();
    List<Apoiador> apoiadores = apoiadorRepository.findAll();

    LocalDate hoje = LocalDate.now();
    LocalDate inicioPeriodo = hoje.minusDays(6);

    Long totalApoiadores = (long) apoiadores.size();
    Long totalCandidatos = (long) candidatos.size();

    Long municipiosAlcancados = apoiadores.stream()
            .map(Apoiador::getMunicipio)
            .filter(this::textoValido)
            .map(this::normalizarComparacao)
            .distinct()
            .count();

    Long cadastrosHoje = apoiadores.stream()
            .filter(apoiador -> apoiador.getCriadoEm() != null)
            .filter(apoiador -> apoiador.getCriadoEm().toLocalDate().equals(hoje))
            .count();

    List<AdminRankingItemResponse> rankingCandidatos = apoiadores.stream()
            .filter(apoiador -> apoiador.getCandidato() != null)
            .collect(Collectors.groupingBy(
                    apoiador -> apoiador.getCandidato().getNomePublico(),
                    Collectors.counting()
            ))
            .entrySet()
            .stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .map(entry -> AdminRankingItemResponse.builder()
                    .nome(entry.getKey())
                    .total(entry.getValue())
                    .build())
            .toList();

    List<AdminRankingItemResponse> rankingMunicipios = apoiadores.stream()
            .map(Apoiador::getMunicipio)
            .filter(this::textoValido)
            .collect(Collectors.groupingBy(
                    String::trim,
                    Collectors.counting()
            ))
            .entrySet()
            .stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .map(entry -> AdminRankingItemResponse.builder()
                    .nome(entry.getKey())
                    .total(entry.getValue())
                    .build())
            .toList();

    List<AdminRankingItemResponse> rankingZonas = apoiadores.stream()
            .map(Apoiador::getZonaEleitoral)
            .filter(zona -> zona != null && zona > 0)
            .collect(Collectors.groupingBy(
                    zona -> "Zona " + zona,
                    Collectors.counting()
            ))
            .entrySet()
            .stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .map(entry -> AdminRankingItemResponse.builder()
                    .nome(entry.getKey())
                    .total(entry.getValue())
                    .build())
            .toList();

    List<AdminRankingItemResponse> rankingSecoes = apoiadores.stream()
            .map(Apoiador::getSecaoEleitoral)
            .filter(secao -> secao != null && secao > 0)
            .collect(Collectors.groupingBy(
                    secao -> "Seção " + secao,
                    Collectors.counting()
            ))
            .entrySet()
            .stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .map(entry -> AdminRankingItemResponse.builder()
                    .nome(entry.getKey())
                    .total(entry.getValue())
                    .build())
            .toList();

    Map<LocalDate, Long> cadastrosPorDia = apoiadores.stream()
            .filter(apoiador -> apoiador.getCriadoEm() != null)
            .map(apoiador -> apoiador.getCriadoEm().toLocalDate())
            .filter(data -> !data.isBefore(inicioPeriodo) && !data.isAfter(hoje))
            .collect(Collectors.groupingBy(
                    data -> data,
                    Collectors.counting()
            ));

    List<AdminCrescimentoDiarioResponse> crescimentoDiario = IntStream
            .rangeClosed(0, 6)
            .mapToObj(inicioPeriodo::plusDays)
            .map(data -> AdminCrescimentoDiarioResponse.builder()
                    .dia(data)
                    .total(cadastrosPorDia.getOrDefault(data, 0L))
                    .build())
            .toList();

    return AdminRelatorioResponse.builder()
            .totalApoiadores(totalApoiadores)
            .totalCandidatos(totalCandidatos)
            .municipiosAlcancados(municipiosAlcancados)
            .cadastrosHoje(cadastrosHoje)
            .rankingCandidatos(rankingCandidatos)
            .rankingMunicipios(rankingMunicipios)
            .rankingZonas(rankingZonas)
            .rankingSecoes(rankingSecoes)
            .crescimentoDiario(crescimentoDiario)
            .build();
}

    private AdminCandidatoResumoResponse montarCandidatoResumo(Candidato candidato) {
        Usuario usuario = candidato.getUsuario();

        Long totalApoiadores = apoiadorRepository.countByCandidatoId(candidato.getId());

        String linkCadastro = buscarLinkAtivoPrincipal(candidato)
                .map(LinkCandidato::getCodigo)
                .orElse(null);

        return AdminCandidatoResumoResponse.builder()
                .id(candidato.getId())
                .nomePublico(candidato.getNomePublico())
                .nomeUsuario(usuario.getNome())
                .email(usuario.getEmail())
                .telefone(usuario.getTelefone())
                .municipioBase(candidato.getMunicipioBase())
                .partido(candidato.getPartido())
                .numeroUrna(candidato.getNumeroUrna())
                .cargoPretendido(candidato.getCargoPretendido())
                .totalApoiadores(totalApoiadores)
                .ativo(candidato.getAtivo())
                .criadoEm(candidato.getCriadoEm())
                .linkCadastro(linkCadastro)
                .build();
    }

    private AdminCandidatoDetalheResponse montarCandidatoDetalhe(Candidato candidato) {
        Usuario usuario = candidato.getUsuario();

        List<Apoiador> apoiadoresDoCandidato = apoiadorRepository.findByCandidatoId(
                candidato.getId(),
                org.springframework.data.domain.Pageable.unpaged()
        ).getContent();

        String linkCadastro = buscarLinkAtivoPrincipal(candidato)
                .map(LinkCandidato::getCodigo)
                .orElse(null);

        LocalDate hoje = LocalDate.now();

        Long totalApoiadores = (long) apoiadoresDoCandidato.size();

        Long municipiosAlcancados = apoiadoresDoCandidato.stream()
                .map(Apoiador::getMunicipio)
                .filter(this::textoValido)
                .map(this::normalizarComparacao)
                .distinct()
                .count();

        Long zonasCadastradas = apoiadoresDoCandidato.stream()
                .map(Apoiador::getZonaEleitoral)
                .filter(zona -> zona != null && zona > 0)
                .distinct()
                .count();

        Long secoesCadastradas = apoiadoresDoCandidato.stream()
                .map(Apoiador::getSecaoEleitoral)
                .filter(secao -> secao != null && secao > 0)
                .distinct()
                .count();

        Long cadastrosHoje = apoiadoresDoCandidato.stream()
                .filter(apoiador -> apoiador.getCriadoEm() != null)
                .filter(apoiador -> apoiador.getCriadoEm().toLocalDate().equals(hoje))
                .count();

        return AdminCandidatoDetalheResponse.builder()
                .id(candidato.getId())
                .usuarioId(usuario.getId())
                .nomeCompleto(usuario.getNome())
                .nomePublico(candidato.getNomePublico())
                .email(usuario.getEmail())
                .telefone(usuario.getTelefone())
                .tituloEleitorUltimos4(usuario.getTituloEleitorUltimos4())
                .municipioBase(candidato.getMunicipioBase())
                .partido(candidato.getPartido())
                .numeroUrna(candidato.getNumeroUrna())
                .cargoPretendido(candidato.getCargoPretendido())
                .observacaoInterna(candidato.getObservacaoInterna())
                .ativo(candidato.getAtivo())
                .criadoEm(candidato.getCriadoEm())
                .atualizadoEm(candidato.getAtualizadoEm())
                .linkCadastro(linkCadastro)
                .totalApoiadores(totalApoiadores)
                .municipiosAlcancados(municipiosAlcancados)
                .zonasCadastradas(zonasCadastradas)
                .secoesCadastradas(secoesCadastradas)
                .cadastrosHoje(cadastrosHoje)
                .build();
    }

    private AdminApoiadorResumoResponse montarApoiadorResumo(Apoiador apoiador) {
        String candidatoNome = null;

        if (apoiador.getCandidato() != null) {
            candidatoNome = apoiador.getCandidato().getNomePublico();
        }

        return AdminApoiadorResumoResponse.builder()
                .id(apoiador.getId())
                .nome(apoiador.getNome())
                .email(apoiador.getEmail())
                .telefone(apoiador.getTelefone())
                .candidatoNome(candidatoNome)
                .municipio(apoiador.getMunicipio())
                .bairro(apoiador.getBairro())
                .zonaEleitoral(apoiador.getZonaEleitoral())
                .secaoEleitoral(apoiador.getSecaoEleitoral())
                .status(apoiador.getStatus() != null ? apoiador.getStatus().name() : null)
                .criadoEm(apoiador.getCriadoEm())
                .build();
    }

    private Candidato buscarCandidatoOuFalhar(UUID id) {
        return candidatoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidato não encontrado."));
    }

    private Optional<LinkCandidato> buscarLinkAtivoPrincipal(Candidato candidato) {
        return linkCandidatoRepository.findByCandidatoId(candidato.getId())
                .stream()
                .filter(link -> Boolean.TRUE.equals(link.getAtivo()))
                .findFirst();
    }

    private String gerarCodigoLink(String nomePublico) {
        String slugBase = normalizarSlug(nomePublico);

        if (!textoValido(slugBase)) {
            slugBase = "candidato";
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
            return "candidato";
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

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
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

private Pageable criarPageable(int page, int size) {
    int paginaNormalizada = Math.max(page, 0);
    int tamanhoNormalizado = Math.min(Math.max(size, 1), 100);

    return PageRequest.of(
            paginaNormalizada,
            tamanhoNormalizado,
            Sort.by(Sort.Direction.DESC, "criadoEm")
    );
}

private AdminCandidatoResumoResponse montarAdminCandidatoResumoPaginado(Candidato candidato) {
    Usuario usuario = candidato.getUsuario();

    String linkCadastro = linkCandidatoRepository.findByCandidatoId(candidato.getId())
            .stream()
            .filter(link -> Boolean.TRUE.equals(link.getAtivo()))
            .map(LinkCandidato::getCodigo)
            .findFirst()
            .orElse(null);

    Long totalApoiadores = apoiadorRepository.countByCandidatoId(candidato.getId());

    return AdminCandidatoResumoResponse.builder()
            .id(candidato.getId())
            .nomePublico(candidato.getNomePublico())
            .nomeUsuario(usuario != null ? usuario.getNome() : null)
            .email(usuario != null ? usuario.getEmail() : null)
            .telefone(usuario != null ? usuario.getTelefone() : null)
            .tituloEleitorUltimos4(usuario != null ? usuario.getTituloEleitorUltimos4() : null)
            .municipioBase(candidato.getMunicipioBase())
            .partido(candidato.getPartido())
            .numeroUrna(candidato.getNumeroUrna())
            .cargoPretendido(candidato.getCargoPretendido())
            .totalApoiadores(totalApoiadores)
            .ativo(candidato.getAtivo())
            .criadoEm(candidato.getCriadoEm())
            .linkCadastro(linkCadastro)
            .build();
}

private AdminApoiadorResumoResponse montarAdminApoiadorResumoPaginado(Apoiador apoiador) {
    Candidato candidato = apoiador.getCandidato();

    return AdminApoiadorResumoResponse.builder()
            .id(apoiador.getId())
            .nome(apoiador.getNome())
            .email(apoiador.getEmail())
            .telefone(apoiador.getTelefone())
            .candidatoNome(candidato != null ? candidato.getNomePublico() : null)
            .municipio(apoiador.getMunicipio())
            .bairro(apoiador.getBairro())
            .zonaEleitoral(apoiador.getZonaEleitoral())
            .secaoEleitoral(apoiador.getSecaoEleitoral())
            .status(apoiador.getStatus() != null ? apoiador.getStatus().name() : null)
            .criadoEm(apoiador.getCriadoEm())
            .build();
}
}