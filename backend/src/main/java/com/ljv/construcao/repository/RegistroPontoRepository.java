package com.ljv.construcao.repository;

import com.ljv.construcao.model.RegistroPonto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RegistroPontoRepository extends JpaRepository<RegistroPonto, Long> {

    List<RegistroPonto> findByFuncionarioIdAndDataBetweenOrderByData(
        Long funcionarioId, LocalDate inicio, LocalDate fim);

    Optional<RegistroPonto> findByFuncionarioIdAndData(Long funcionarioId, LocalDate data);

    @Query("SELECT r FROM RegistroPonto r JOIN FETCH r.funcionario " +
           "WHERE r.data BETWEEN :inicio AND :fim " +
           "ORDER BY r.funcionario.nome, r.data")
    List<RegistroPonto> findAllByPeriodo(
        @Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}
