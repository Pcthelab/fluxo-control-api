package com.fluxo.fluxoapi.repository;

import com.fluxo.fluxoapi.entity.Lancamento;
import com.fluxo.fluxoapi.entity.Usuario;
import com.fluxo.fluxoapi.enums.TipoLancamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LancamentoRepository extends JpaRepository<Lancamento, Long> {

    List<Lancamento> findByUsuarioOrderByDataDescIdDesc(Usuario usuario);

    List<Lancamento> findByUsuarioAndTipoOrderByValorDesc(Usuario usuario, TipoLancamento tipo);
}