# Render não tem runtime Java. O serviço do backend precisa usar Language = Docker.
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
# VPS 4GB: heap baixo; buildar backend sozinho (não junto com o frontend)
ENV MAVEN_OPTS="-Xmx384m -XX:MaxMetaspaceSize=192m -Djava.awt.headless=true"
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/construcao-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=50.0", "-XX:+ExitOnOutOfMemoryError", "-jar", "app.jar"]
