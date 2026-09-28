package com.ljv.construcao.controller;

import com.ljv.construcao.dto.OrcamentoAcompanhamentoRequest;
import com.ljv.construcao.model.Cliente;
import com.ljv.construcao.model.ItemOrcamento;
import com.ljv.construcao.model.Obra;
import com.ljv.construcao.model.Orcamento;
import com.ljv.construcao.model.enums.PeriodicidadePagamentoObra;
import com.ljv.construcao.model.enums.StatusObra;
import com.ljv.construcao.model.enums.StatusOrcamento;
import com.ljv.construcao.repository.ItemObraRepository;
import com.ljv.construcao.repository.ObraRepository;
import com.ljv.construcao.repository.OrcamentoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orcamentos")
@RequiredArgsConstructor
public class OrcamentoController {

    private static final List<StatusOrcamento> ABERTOS = List.of(
        StatusOrcamento.ENVIADO, StatusOrcamento.EM_ANALISE
    );
    private static final List<StatusOrcamento> AGUARDANDO = List.of(
        StatusOrcamento.ENVIADO, StatusOrcamento.EM_ANALISE
    );

    private final OrcamentoRepository orcamentoRepository;
    private final ObraRepository obraRepository;
    private final ItemObraRepository itemObraRepository;

    @GetMapping
    public ResponseEntity<Page<Orcamento>> listar(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) StatusOrcamento status
    ) {
        expirarVencidos();
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "criadoEm"));
        Page<Orcamento> resultado;
        if (q != null && !q.isBlank()) {
            resultado = orcamentoRepository.buscar(q, pageable);
        } else if (status != null) {
            resultado = orcamentoRepository.findByStatusComRelacoes(status, pageable);
        } else {
            resultado = orcamentoRepository.findAllComRelacoes(pageable);
        }
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/resumo")
    public ResponseEntity<Map<String, Object>> resumo() {
        expirarVencidos();
        LocalDate hoje = LocalDate.now();
        List<Orcamento> fila = orcamentoRepository.findComClientePorStatus(AGUARDANDO);
        List<Orcamento> acompanhar = fila.stream().filter(o -> precisaAcompanhar(o, hoje)).toList();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("rascunhos", orcamentoRepository.countByStatus(StatusOrcamento.RASCUNHO));
        out.put("aguardandoResposta", orcamentoRepository.countByStatusIn(AGUARDANDO));
        out.put("followUpHoje", acompanhar.size());
        out.put("aprovados", orcamentoRepository.countByStatus(StatusOrcamento.APROVADO));
        out.put("recusados", orcamentoRepository.countByStatus(StatusOrcamento.REPROVADO));
        out.put("expirados", orcamentoRepository.countByStatus(StatusOrcamento.EXPIRADO));
        out.put("aprovadosMes", orcamentoRepository.countAprovadosDesde(YearMonth.now().atDay(1)));
        out.put("acompanhar", acompanhar.stream().map(this::resumoItem).toList());
        return ResponseEntity.ok(out);
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<Orcamento> buscarPorId(@PathVariable Long id) {
        return orcamentoRepository.findDetalheById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Orcamento> criar(@Valid @RequestBody Orcamento orcamento) {
        orcamento.setId(null);
        orcamento.setNumero(gerarNumero());
        List<ItemOrcamento> itens = prepararItens(orcamento, orcamento.getItens());
        orcamento.setItens(itens);
        recalcularTotais(orcamento);
        return ResponseEntity.ok(orcamentoRepository.save(orcamento));
    }

    @PutMapping("/{id:\\d+}")
    public ResponseEntity<Orcamento> atualizar(@PathVariable Long id, @Valid @RequestBody Orcamento dados) {
        return orcamentoRepository.findById(id).map(orc -> {
            orc.setTitulo(dados.getTitulo());
            orc.setDescricao(dados.getDescricao());
            orc.setStatus(dados.getStatus());
            if (dados.getStatus() == StatusOrcamento.APROVADO || dados.getStatus() == StatusOrcamento.REPROVADO) {
                if (orc.getDataResposta() == null) {
                    orc.setDataResposta(LocalDate.now());
                }
                orc.setProximoFollowUp(null);
            }
            orc.setCliente(dados.getCliente());
            if (dados.getObra() != null && dados.getObra().getId() != null) {
                orc.setObra(dados.getObra());
            }
            orc.setDesconto(dados.getDesconto());
            orc.setDataValidade(dados.getDataValidade());
            orc.setLocalServico(dados.getLocalServico());
            orc.setPrazoExecucao(dados.getPrazoExecucao());
            orc.setGarantia(dados.getGarantia());
            orc.setFormaPagamento(dados.getFormaPagamento());
            orc.setEntradaPercentual(dados.getEntradaPercentual());
            orc.setNumeroParcelas(dados.getNumeroParcelas());
            orc.setCondicoesPagamento(dados.getCondicoesPagamento());
            orc.setIncluso(dados.getIncluso());
            orc.setNaoIncluso(dados.getNaoIncluso());
            orc.setObservacoes(dados.getObservacoes());
            orc.setProximoFollowUp(dados.getProximoFollowUp());
            orc.setNotaAcompanhamento(dados.getNotaAcompanhamento());

            if (orc.getItens() == null) {
                orc.setItens(new ArrayList<>());
            }
            orc.getItens().clear();
            orc.getItens().addAll(prepararItens(orc, dados.getItens()));
            recalcularTotais(orc);
            if (dados.getStatus() == StatusOrcamento.APROVADO) {
                garantirObra(orc);
            }
            orcamentoRepository.save(orc);
            return ResponseEntity.ok(orcamentoRepository.findDetalheById(id).orElse(orc));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id:\\d+}/acompanhamento")
    public ResponseEntity<Orcamento> atualizarAcompanhamento(
        @PathVariable Long id,
        @RequestBody OrcamentoAcompanhamentoRequest req
    ) {
        return orcamentoRepository.findById(id).map(orc -> {
            LocalDate hoje = LocalDate.now();
            LocalDateTime agora = LocalDateTime.now();

            if (Boolean.TRUE.equals(req.getMarcarEnviado())) {
                if (orc.getStatus() == StatusOrcamento.RASCUNHO || orc.getStatus() == null) {
                    orc.setStatus(StatusOrcamento.ENVIADO);
                }
                if (orc.getEnviadoEm() == null) {
                    orc.setEnviadoEm(agora);
                }
                orc.setUltimoContatoEm(agora);
                if (orc.getProximoFollowUp() == null) {
                    orc.setProximoFollowUp(hoje.plusDays(3));
                }
            }

            if (req.getStatus() != null) {
                orc.setStatus(req.getStatus());
                if (req.getStatus() == StatusOrcamento.APROVADO || req.getStatus() == StatusOrcamento.REPROVADO) {
                    orc.setDataResposta(hoje);
                    orc.setProximoFollowUp(null);
                }
                if (req.getStatus() == StatusOrcamento.APROVADO) {
                    garantirObra(orc);
                }
                if (req.getStatus() == StatusOrcamento.ENVIADO && orc.getEnviadoEm() == null) {
                    orc.setEnviadoEm(agora);
                }
            }

            if (req.getProximoFollowUp() != null) {
                orc.setProximoFollowUp(req.getProximoFollowUp());
            }
            if (req.getAdiarDias() != null && req.getAdiarDias() > 0) {
                orc.setProximoFollowUp(hoje.plusDays(req.getAdiarDias()));
                orc.setUltimoContatoEm(agora);
            }
            if (req.getNotaAcompanhamento() != null) {
                orc.setNotaAcompanhamento(req.getNotaAcompanhamento());
            }

            orcamentoRepository.save(orc);
            return ResponseEntity.ok(orcamentoRepository.findDetalheById(id).orElse(orc));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        if (!orcamentoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        orcamentoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void garantirObra(Orcamento orc) {
        if (orc.getObra() != null && orc.getObra().getId() != null) {
            return;
        }
        Obra obra = new Obra();
        obra.setNome(orc.getTitulo());
        obra.setDescricao(orc.getDescricao());
        obra.setStatus(StatusObra.APROVADA);
        Cliente cliente = orc.getCliente();
        if (cliente != null && cliente.getId() != null) {
            Cliente ref = new Cliente();
            ref.setId(cliente.getId());
            obra.setCliente(ref);
            if (cliente.getCidade() != null) obra.setCidade(cliente.getCidade());
            if (cliente.getEstado() != null) obra.setEstado(cliente.getEstado());
            if (cliente.getCep() != null) obra.setCep(cliente.getCep());
            if (cliente.getBairro() != null) obra.setBairro(cliente.getBairro());
            if (cliente.getLogradouro() != null) obra.setLogradouro(cliente.getLogradouro());
            if (cliente.getNumero() != null) obra.setNumero(cliente.getNumero());
            if (cliente.getComplemento() != null) obra.setComplemento(cliente.getComplemento());
        }
        BigDecimal valor = orc.getValorFinal() != null ? orc.getValorFinal() : orc.getValorTotal();
        obra.setValorContrato(valor);
        obra.setValorOrcado(orc.getValorTotal());
        obra.setDataInicio(LocalDate.now());
        obra.setPercentualConcluido(BigDecimal.ZERO);
        obra.setPeriodicidadePagamento(
            orc.getNumeroParcelas() != null && orc.getNumeroParcelas() > 1
                ? PeriodicidadePagamentoObra.MENSAL
                : PeriodicidadePagamentoObra.UNICO
        );
        StringBuilder obs = new StringBuilder();
        obs.append("Gerada a partir do orçamento ");
        obs.append(orc.getNumero() != null ? orc.getNumero() : "").append(".");
        if (orc.getLocalServico() != null && !orc.getLocalServico().isBlank()) {
            obs.append("\nLocal: ").append(orc.getLocalServico());
            if (obra.getLogradouro() == null || obra.getLogradouro().isBlank()) {
                String local = orc.getLocalServico();
                obra.setLogradouro(local.length() > 200 ? local.substring(0, 200) : local);
            }
        }
        if (orc.getFormaPagamento() != null && !orc.getFormaPagamento().isBlank()) {
            obs.append("\nPagamento: ").append(orc.getFormaPagamento());
        }
        if (orc.getPrazoExecucao() != null && !orc.getPrazoExecucao().isBlank()) {
            obs.append("\nPrazo: ").append(orc.getPrazoExecucao());
        }
        obra.setObservacoes(obs.toString().trim());
        Obra salva = obraRepository.save(obra);
        orc.setObra(salva);

        List<ItemOrcamento> itensOrigem = orc.getItens();
        if (itensOrigem == null || itensOrigem.isEmpty()) {
            itensOrigem = orcamentoRepository.findDetalheById(orc.getId())
                .map(Orcamento::getItens)
                .orElse(List.of());
        }
        if (itensOrigem != null && !itensOrigem.isEmpty()) {
            ItemObraController.copiarItensDoOrcamento(salva, itensOrigem, itemObraRepository);
            BigDecimal escopo = itemObraRepository.somarAtivos(salva.getId());
            if (escopo != null && escopo.compareTo(BigDecimal.ZERO) > 0) {
                salva.setValorContrato(escopo);
                obraRepository.save(salva);
            }
        }
    }

    private void expirarVencidos() {
        List<Orcamento> vencidos = orcamentoRepository.findByStatusInAndDataValidadeBefore(ABERTOS, LocalDate.now());
        if (vencidos.isEmpty()) return;
        vencidos.forEach(o -> o.setStatus(StatusOrcamento.EXPIRADO));
        orcamentoRepository.saveAll(vencidos);
    }

    private boolean precisaAcompanhar(Orcamento o, LocalDate hoje) {
        if (o.getDataValidade() != null && !o.getDataValidade().isAfter(hoje.plusDays(2))) {
            return true;
        }
        if (o.getProximoFollowUp() != null) {
            return !o.getProximoFollowUp().isAfter(hoje);
        }
        LocalDate base = o.getEnviadoEm() != null ? o.getEnviadoEm().toLocalDate() : (o.getCriadoEm() != null ? o.getCriadoEm().toLocalDate() : hoje);
        return !base.plusDays(3).isAfter(hoje);
    }

    private Map<String, Object> resumoItem(Orcamento o) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", o.getId());
        m.put("numero", o.getNumero());
        m.put("titulo", o.getTitulo());
        m.put("status", o.getStatus());
        m.put("valorFinal", o.getValorFinal());
        m.put("proximoFollowUp", o.getProximoFollowUp());
        m.put("dataValidade", o.getDataValidade());
        m.put("clienteNome", o.getCliente() != null ? o.getCliente().getNome() : null);
        return m;
    }

    private List<ItemOrcamento> prepararItens(Orcamento orc, List<ItemOrcamento> origem) {
        List<ItemOrcamento> itens = new ArrayList<>();
        if (origem == null) return itens;
        int ordem = 0;
        for (ItemOrcamento bruto : origem) {
            if (bruto.getDescricao() == null || bruto.getDescricao().isBlank()) continue;
            ItemOrcamento item = new ItemOrcamento();
            item.setOrcamento(orc);
            item.setDescricao(bruto.getDescricao().trim());
            item.setObservacao(bruto.getObservacao());
            item.setUnidade(bruto.getUnidade());
            BigDecimal qtd = bruto.getQuantidade() != null ? bruto.getQuantidade() : BigDecimal.ONE;
            BigDecimal unit = bruto.getValorUnitario() != null ? bruto.getValorUnitario() : BigDecimal.ZERO;
            item.setQuantidade(qtd);
            item.setValorUnitario(unit);
            item.setValorTotal(qtd.multiply(unit));
            item.setOrdem(ordem++);
            itens.add(item);
        }
        return itens;
    }

    private void recalcularTotais(Orcamento orc) {
        BigDecimal subtotal = orc.getItens() == null
            ? BigDecimal.ZERO
            : orc.getItens().stream()
                .map(i -> i.getValorTotal() != null ? i.getValorTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        orc.setValorTotal(subtotal);
        BigDecimal desc = orc.getDesconto() != null ? orc.getDesconto() : BigDecimal.ZERO;
        orc.setValorFinal(subtotal.subtract(desc).max(BigDecimal.ZERO));
    }

    private String gerarNumero() {
        int ano = Year.now().getValue();
        String prefix = "ORC-" + ano + "-%";
        Integer max = orcamentoRepository.findMaxNumero(prefix);
        int proximo = (max != null ? max : 0) + 1;
        return String.format("ORC-%d-%03d", ano, proximo);
    }
}
