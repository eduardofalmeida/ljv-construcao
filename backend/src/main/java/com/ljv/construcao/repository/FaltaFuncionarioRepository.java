package com.ljv.construcao.repository;

import com.ljv.construcao.model.FaltaFuncionario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FaltaFuncionarioRepository extends JpaRepository<FaltaFuncionario, Long> {

    List<FaltaFuncionario> findByFuncionarioIdAndDataBetweenOrderByDataDesc(
        Long funcionarioId, LocalDate inicio, LocalDate fim);

    @Query("SELECT f FROM FaltaFuncionario f JOIN FETCH f.funcionario WHERE f.data BETWEEN :inicio AND :fim ORDER BY f.funcionario.nome, f.data")
    List<FaltaFuncionario> findAllByPeriodo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    Optional<FaltaFuncionario> findByFuncionarioIdAndData(Long funcionarioId, LocalDate data);

    boolean existsByFuncionarioIdAndData(Long funcionarioId, LocalDate data);
}
