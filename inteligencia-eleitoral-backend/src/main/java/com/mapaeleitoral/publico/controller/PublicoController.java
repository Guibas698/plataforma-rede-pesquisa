package com.mapaeleitoral.publico.controller;

import com.mapaeleitoral.publico.dto.CadastroApoiadorPublicoRequest;
import com.mapaeleitoral.publico.dto.CadastroApoiadorPublicoResponse;
import com.mapaeleitoral.publico.dto.LinkPublicoResponse;
import com.mapaeleitoral.publico.service.PublicoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável pelos endpoints públicos do sistema.
 *
 * Esses endpoints serão usados pelo frontend nas rotas:
 * - /cadastro/[codigo]
 * - /cadastro/sucesso
 */
@RestController
@RequestMapping("/api/publico")
@RequiredArgsConstructor
public class PublicoController {

    private final PublicoService publicoService;

    /**
     * Busca os dados públicos de um candidato a partir do código do link.
     *
     * Endpoint:
     * GET /api/publico/links/{codigo}
     */
    @GetMapping("/links/{codigo}")
    public ResponseEntity<LinkPublicoResponse> buscarLinkPorCodigo(
            @PathVariable String codigo
    ) {
        LinkPublicoResponse response = publicoService.buscarLinkPorCodigo(codigo);
        return ResponseEntity.ok(response);
    }

    /**
     * Cadastra publicamente um apoiador a partir do link de um candidato.
     *
     * Endpoint:
     * POST /api/publico/apoiadores
     */
    @PostMapping("/apoiadores")
    public ResponseEntity<CadastroApoiadorPublicoResponse> cadastrarApoiador(
            @Valid @RequestBody CadastroApoiadorPublicoRequest request
    ) {
        CadastroApoiadorPublicoResponse response = publicoService.cadastrarApoiador(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}