# Render não tem runtime Java. O serviço do backend precisa usar Language = Docker.
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
# Limita RAM do Maven — VPS pequena trava sem isso
ENV MAVEN_OPTS="-Xmx512m -XX:MaxMetaspaceSize=256m"
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests -T 1C package

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/construcao-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=50.0", "-XX:+ExitOnOutOfMemoryError", "-jar", "app.jar"]
