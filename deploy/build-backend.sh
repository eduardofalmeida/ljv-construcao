#!/usr/bin/env bash
# Compila o JAR na VPS (fora do Docker) — evita travar com 4GB de RAM.
set -euo pipefail
cd "$(dirname "$0")/../backend"

if ! command -v mvn >/dev/null 2>&1; then
  echo "Instalando Java 21 + Maven..."
  apt-get update -y
  DEBIAN_FRONTEND=noninteractive apt-get install -y openjdk-21-jdk-headless maven
fi

export MAVEN_OPTS="${MAVEN_OPTS:--Xmx512m -XX:MaxMetaspaceSize=256m}"
echo "Compilando backend (MAVEN_OPTS=$MAVEN_OPTS)..."
mvn -B -DskipTests package
ls -lh target/construcao-0.0.1-SNAPSHOT.jar
echo "OK — agora rode: docker compose -f docker-compose.prod.yml --env-file .env.prod build backend"
