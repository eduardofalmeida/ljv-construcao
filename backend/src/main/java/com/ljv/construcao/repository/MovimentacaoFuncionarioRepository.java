package com.ljv.construcao.repository;

import com.ljv.construcao.model.MovimentacaoFuncionario;
import com.ljv.construcao.model.enums.TipoMovimentacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;



public interface MovimentacaoFuncionarioRepository extends JpaRepository<MovimentacaoFuncionario, Long> {

    /** Todos os lançamentos pendentes (não pagos) de todos os funcionários */
    @Query("SELECT m FROM MovimentacaoFuncionario m JOIN FETCH m.funcionario WHERE m.pago = false ORDER BY m.funcionario.nome, m.data DESC")
    List<MovimentacaoFuncionario> findAllPendentes();

    List<MovimentacaoFuncionario> findByFuncionarioIdOrderByDataDesc(Long funcionarioId);

    List<MovimentacaoFuncionario> findByFuncionarioIdAndDataBetweenOrderByDataDesc(
        Long funcionarioId, LocalDate inicio, LocalDate fim);

    /** Total de vales não descontados (ainda não abatidos de um pagamento) para o período */
    @Query("SELECT COALESCE(SUM(m.valor), 0) FROM MovimentacaoFuncionario m " +
           "WHERE m.funcionario.id = :funcId AND m.tipo = :tipo AND m.pago = false " +
           "AND m.data BETWEEN :inicio AND :fim")
    BigDecimal somarPorTipoNaoPago(
        @Param("funcId") Long funcId,
        @Param("tipo") TipoMovimentacao tipo,
        @Param("inicio") LocalDate inicio,
        @Param("fim") LocalDate fim);

    /**
     * Soma todos os vales ainda não abatidos até a data informada (inclusive).
     * Usado no saldo do ciclo: adiantamento aberto reduz o próximo pagamento
     * independentemente de ter ficado de um ciclo anterior sem quitação.
     */
    @Query("SELECT COALESCE(SUM(m.valor), 0) FROM MovimentacaoFuncionario m " +
           "WHERE m.funcionario.id = :funcId AND m.tipo = :tipo " +
           "AND m.pago = false AND m.data <= :ate")
    BigDecimal somarValesPendentesAte(
        @Param("funcId") Long funcId,
        @Param("tipo") TipoMovimentacao tipo,
        @Param("ate") LocalDate ate);

    /** Lista vales ainda não abatidos até a data (para quitar ao confirmar pagamento). */
    @Query("SELECT m FROM MovimentacaoFuncionario m " +
           "WHERE m.funcionario.id = :funcId AND m.tipo = :tipo " +
           "AND m.pago = false AND m.data <= :ate " +
           "ORDER BY m.data ASC")
    List<MovimentacaoFuncionario> findValesPendentesAte(
        @Param("funcId") Long funcId,
        @Param("tipo") TipoMovimentacao tipo,
        @Param("ate") LocalDate ate);

    /** Total geral de um tipo no período (pago ou não) */
    @Query("SELECT COALESCE(SUM(m.valor), 0) FROM MovimentacaoFuncionario m " +
           "WHERE m.funcionario.id = :funcId AND m.tipo = :tipo " +
           "AND m.data BETWEEN :inicio AND :fim")
    BigDecimal somarPorTipo(
        @Param("funcId") Long funcId,
        @Param("tipo") TipoMovimentacao tipo,
        @Param("inicio") LocalDate inicio,
        @Param("fim") LocalDate fim);

    /**
     * Retorna o pagamento mais recente já quitado do funcionário.
     * Usado para determinar o início do ciclo atual.
     */
    @Query("SELECT m FROM MovimentacaoFuncionario m " +
           "WHERE m.funcionario.id = :funcId " +
           "AND m.tipo = 'PAGAMENTO' AND m.pago = true " +
           "ORDER BY COALESCE(m.dataPagamento, m.data) DESC")
    List<MovimentacaoFuncionario> findUltimosPagamentos(
        @Param("funcId") Long funcId, org.springframework.data.domain.Pageable pageable);
}
