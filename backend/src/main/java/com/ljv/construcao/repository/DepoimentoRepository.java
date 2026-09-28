package com.ljv.construcao.repository;

import com.ljv.construcao.model.Depoimento;
import com.ljv.construcao.model.enums.StatusDepoimento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DepoimentoRepository extends JpaRepository<Depoimento, Long> {

    List<Depoimento> findByStatusOrderByCriadoEmDesc(StatusDepoimento status);

    List<Depoimento> findAllByOrderByCriadoEmDesc();

    long countByStatus(StatusDepoimento status);
}
