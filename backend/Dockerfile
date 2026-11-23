# Build completo em Docker (PaaS). Na VPS 4GB preferir Dockerfile.runtime + deploy/build-backend.sh
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx384m -XX:MaxMetaspaceSize=192m -Djava.awt.headless=true"
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/construcao-0.0.1-SNAPSHOT.jar app.jar
ENV JAVA_TOOL_OPTIONS="\
-XX:+UseContainerSupport \
-XX:MaxRAMPercentage=65.0 \
-XX:InitialRAMPercentage=25.0 \
-XX:+UseG1GC \
-XX:MaxGCPauseMillis=200 \
-XX:+ExitOnOutOfMemoryError \
-XX:TieredStopAtLevel=1 \
-Djava.security.egd=file:/dev/./urandom \
-Dfile.encoding=UTF-8"
EXPOSE 8080
HEALTHCHECK --interval=20s --timeout=5s --start-period=90s --retries=8 \
  CMD curl -fsS http://127.0.0.1:8080/api/actuator/health/liveness >/dev/null || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
