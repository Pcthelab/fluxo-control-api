package com.fluxo.fluxoapi.dto;

import java.math.BigDecimal;
import java.util.List;

public record ResumoDTO(
        BigDecimal totalReceitas,
        BigDecimal totalDespesas,
        BigDecimal saldo,
        List<LancamentoDTO> topDespesas
) {}