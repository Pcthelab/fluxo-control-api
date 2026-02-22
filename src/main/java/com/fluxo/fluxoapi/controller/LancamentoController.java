package com.fluxo.fluxoapi.controller;

import com.fluxo.fluxoapi.dto.LancamentoDTO;
import com.fluxo.fluxoapi.dto.ResumoDTO;
import com.fluxo.fluxoapi.service.LancamentoService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lancamentos")
public class LancamentoController {

    private final LancamentoService lancamentoService;

    public LancamentoController(LancamentoService lancamentoService) {
        this.lancamentoService = lancamentoService;
    }

    @PostMapping
    public LancamentoDTO criar(Authentication auth, @RequestBody LancamentoDTO dto) {
        return lancamentoService.criar(auth.getName(), dto);
    }

    @GetMapping
    public List<LancamentoDTO> listar(Authentication auth) {
        return lancamentoService.listar(auth.getName());
    }

    
@PutMapping("/{id}")
public LancamentoDTO atualizar(Authentication auth, @PathVariable Long id, @RequestBody LancamentoDTO dto) {
    return lancamentoService.atualizar(auth.getName(), id, dto);
}

@DeleteMapping("/{id}")
    public void deletar(Authentication auth, @PathVariable Long id) {
        lancamentoService.deletar(auth.getName(), id);
    }

    @GetMapping("/resumo")
    public ResumoDTO resumo(Authentication auth) {
        return lancamentoService.resumo(auth.getName());
    }
}