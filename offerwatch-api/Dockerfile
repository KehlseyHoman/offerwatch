# ─── Build stage ──────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependencies first
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Build the application
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# App Runner sends traffic to this port (configured as the service "port")
ENV PORT=8080
EXPOSE 8080

# Run as non-root
RUN useradd -r -u 1001 appuser
USER appuser

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
