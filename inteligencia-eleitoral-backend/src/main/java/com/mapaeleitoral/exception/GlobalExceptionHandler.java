package com.mapaeleitoral.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

/**
 * Handler global responsável por padronizar as respostas de erro da API.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Trata erros de regra de negócio lançados pela aplicação.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiErrorResponse> tratarRuntimeException(
            RuntimeException ex,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.BAD_REQUEST;

        ApiErrorResponse response = montarErro(
                status,
                ex.getMessage(),
                request
        );

        return ResponseEntity.status(status).body(response);
    }

    /**
     * Trata erros de validação dos DTOs com Bean Validation.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> tratarErroValidacao(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.BAD_REQUEST;

        String mensagem = extrairPrimeiraMensagemValidacao(ex);

        ApiErrorResponse response = montarErro(
                status,
                mensagem,
                request
        );

        return ResponseEntity.status(status).body(response);
    }

    /**
     * Trata tentativas de acesso sem permissão.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> tratarAcessoNegado(
            AccessDeniedException ex,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.FORBIDDEN;

        ApiErrorResponse response = montarErro(
                status,
                "Acesso negado.",
                request
        );

        return ResponseEntity.status(status).body(response);
    }

    /**
     * Trata casos em que um usuário não é encontrado.
     */
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> tratarUsuarioNaoEncontrado(
            UsernameNotFoundException ex,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.NOT_FOUND;

        ApiErrorResponse response = montarErro(
                status,
                ex.getMessage(),
                request
        );

        return ResponseEntity.status(status).body(response);
    }

    /**
     * Trata qualquer erro inesperado não mapeado anteriormente.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> tratarExceptionGenerica(
            Exception ex,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;

        ApiErrorResponse response = montarErro(
                status,
                "Erro interno do servidor.",
                request
        );

        return ResponseEntity.status(status).body(response);
    }

    private ApiErrorResponse montarErro(
            HttpStatus status,
            String mensagem,
            HttpServletRequest request
    ) {
        return ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .erro(status.getReasonPhrase())
                .mensagem(mensagem)
                .caminho(request.getRequestURI())
                .build();
    }

    private String extrairPrimeiraMensagemValidacao(MethodArgumentNotValidException ex) {
        if (ex.getBindingResult().hasFieldErrors()) {
            FieldError fieldError = ex.getBindingResult().getFieldErrors().get(0);

            if (fieldError.getDefaultMessage() != null && !fieldError.getDefaultMessage().isBlank()) {
                return fieldError.getDefaultMessage();
            }
        }

        if (ex.getBindingResult().hasGlobalErrors()) {
            String mensagemGlobal = ex.getBindingResult().getGlobalErrors().get(0).getDefaultMessage();

            if (mensagemGlobal != null && !mensagemGlobal.isBlank()) {
                return mensagemGlobal;
            }
        }

        return "Erro de validação.";
    }
}