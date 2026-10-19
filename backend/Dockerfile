# ==========================================
# Stage 1: Build the Application
# ==========================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Cache dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package executable JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==========================================
# Stage 2: Minimal Runtime Image (~160MB)
# ==========================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Run as an unprivileged service user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy built JAR from builder
COPY --from=builder /build/target/*.jar app.jar

# Cloud environment defaults
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

# Tuned for 512MB RAM free-tier containers (Render, Koyeb, Railway):
# - MaxRAMPercentage=75.0: caps heap at 380MB, leaving buffer for metaspace and OS
# - TieredStopAtLevel=1: minimizes JIT compiler RAM and accelerates container cold starts
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:+TieredCompilation", \
  "-XX:TieredStopAtLevel=1", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
