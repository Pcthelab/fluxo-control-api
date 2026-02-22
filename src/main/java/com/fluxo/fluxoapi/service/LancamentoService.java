package com.fluxo.fluxoapi.service;

import com.fluxo.fluxoapi.dto.LancamentoDTO;
import com.fluxo.fluxoapi.dto.ResumoDTO;
import com.fluxo.fluxoapi.entity.Lancamento;
import com.fluxo.fluxoapi.entity.Usuario;
import com.fluxo.fluxoapi.enums.TipoLancamento;
import com.fluxo.fluxoapi.repository.LancamentoRepository;
import com.fluxo.fluxoapi.repository.UsuarioRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class LancamentoService {

    private final LancamentoRepository lancamentoRepository;
    private final UsuarioRepository usuarioRepository;

    public LancamentoService(LancamentoRepository lancamentoRepository, UsuarioRepository usuarioRepository) {
        this.lancamentoRepository = lancamentoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    private Usuario usuarioDoEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Usuário não encontrado"));
    }

    private LancamentoDTO toDTO(Lancamento l) {
        return new LancamentoDTO(
                l.getId(),
                l.getTipo(),
                l.getCategoria(),
                l.getDescricao(),
                l.getValor(),
                l.getData()
        );
    }

    public LancamentoDTO criar(String email, LancamentoDTO dto) {
        Usuario u = usuarioDoEmail(email);

        Lancamento l = Lancamento.builder()
                .tipo(dto.tipo())
                .categoria(dto.categoria())
                .descricao(dto.descricao())
                .valor(dto.valor())
                .data(dto.data())
                .usuario(u)
                .build();

        Lancamento saved = lancamentoRepository.save(l);
        return toDTO(saved);
    }

    public List<LancamentoDTO> listar(String email) {
        Usuario u = usuarioDoEmail(email);
        return lancamentoRepository.findByUsuarioOrderByDataDescIdDesc(u)
                .stream().map(this::toDTO).toList();
    }


public LancamentoDTO atualizar(String email, Long id, LancamentoDTO dto) {
    Lancamento l = lancamentoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Lançamento não encontrado"));

    if (!l.getUsuario().getEmail().equals(email)) {
        throw new RuntimeException("Acesso negado");
    }

    l.setTipo(dto.tipo());
    l.setCategoria(dto.categoria());
    l.setDescricao(dto.descricao());
    l.setValor(dto.valor());
    l.setData(dto.data());

    Lancamento salvo = lancamentoRepository.save(l);
    return toDTO(salvo);
}
    public void deletar(String email, Long id) {
        Usuario u = usuarioDoEmail(email);
        Lancamento l = lancamentoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lançamento não encontrado"));

        if (!l.getUsuario().getId().equals(u.getId())) {
            throw new AccessDeniedException("Sem permissão");
        }

        lancamentoRepository.delete(l);
    }

    public ResumoDTO resumo(String email) {
        Usuario u = usuarioDoEmail(email);

        List<Lancamento> all = lancamentoRepository.findByUsuarioOrderByDataDescIdDesc(u);

        BigDecimal receitas = all.stream()
                .filter(x -> x.getTipo() == TipoLancamento.RECEITA)
                .map(Lancamento::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal despesas = all.stream()
                .filter(x -> x.getTipo() == TipoLancamento.DESPESA)
                .map(Lancamento::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saldo = receitas.subtract(despesas);

        List<LancamentoDTO> topDespesas = lancamentoRepository
                .findByUsuarioAndTipoOrderByValorDesc(u, TipoLancamento.DESPESA)
                .stream()
                .limit(5)
                .map(this::toDTO)
                .toList();

        return new ResumoDTO(receitas, despesas, saldo, topDespesas);
    }
}