package com.ljv.construcao.repository;

import com.ljv.construcao.model.Orcamento;
import com.ljv.construcao.model.enums.StatusOrcamento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrcamentoRepository extends JpaRepository<Orcamento, Long> {

    @Query(
        value = "SELECT o FROM Orcamento o LEFT JOIN FETCH o.cliente LEFT JOIN FETCH o.obra",
        countQuery = "SELECT COUNT(o) FROM Orcamento o"
    )
    Page<Orcamento> findAllComRelacoes(Pageable pageable);

    @Query(
        value = "SELECT o FROM Orcamento o LEFT JOIN FETCH o.cliente LEFT JOIN FETCH o.obra WHERE o.status = :status",
        countQuery = "SELECT COUNT(o) FROM Orcamento o WHERE o.status = :status"
    )
    Page<Orcamento> findByStatusComRelacoes(@Param("status") StatusOrcamento status, Pageable pageable);

    @Query(
        value = "SELECT o FROM Orcamento o LEFT JOIN FETCH o.cliente LEFT JOIN FETCH o.obra WHERE " +
                "LOWER(o.titulo) LIKE LOWER(CONCAT('%', :q, '%')) OR o.numero LIKE CONCAT('%', :q, '%')",
        countQuery = "SELECT COUNT(o) FROM Orcamento o WHERE " +
                     "LOWER(o.titulo) LIKE LOWER(CONCAT('%', :q, '%')) OR o.numero LIKE CONCAT('%', :q, '%')"
    )
    Page<Orcamento> buscar(@Param("q") String q, Pageable pageable);

    @Query("SELECT DISTINCT o FROM Orcamento o " +
           "LEFT JOIN FETCH o.cliente LEFT JOIN FETCH o.obra LEFT JOIN FETCH o.itens " +
           "WHERE o.id = :id")
    Optional<Orcamento> findDetalheById(@Param("id") Long id);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(o.numero, 10) AS int)), 0) FROM Orcamento o WHERE o.numero LIKE :prefix")
    Integer findMaxNumero(@Param("prefix") String prefix);

    long countByStatus(StatusOrcamento status);

    long countByStatusIn(Collection<StatusOrcamento> status);

    @Query("SELECT o FROM Orcamento o LEFT JOIN FETCH o.cliente WHERE o.status IN :status")
    List<Orcamento> findComClientePorStatus(@Param("status") Collection<StatusOrcamento> status);

    List<Orcamento> findByStatusInAndDataValidadeBefore(Collection<StatusOrcamento> status, LocalDate limite);

    @Query("SELECT COUNT(o) FROM Orcamento o WHERE o.status = com.ljv.construcao.model.enums.StatusOrcamento.APROVADO AND o.dataResposta >= :inicio")
    long countAprovadosDesde(@Param("inicio") LocalDate inicio);

    @Query("SELECT DISTINCT o FROM Orcamento o LEFT JOIN FETCH o.itens WHERE o.obra.id = :obraId")
    Optional<Orcamento> findByObraIdComItens(@Param("obraId") Long obraId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Orcamento o SET o.obra = null WHERE o.obra.id = :obraId")
    void desvincularObra(@Param("obraId") Long obraId);
}
