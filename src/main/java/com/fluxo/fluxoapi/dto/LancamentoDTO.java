package com.fluxo.fluxoapi.dto;

import com.fluxo.fluxoapi.enums.Categoria;
import com.fluxo.fluxoapi.enums.TipoLancamento;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LancamentoDTO(
        Long id,
        TipoLancamento tipo,
        Categoria categoria,
        String descricao,
        BigDecimal valor,
        LocalDate data
) {}