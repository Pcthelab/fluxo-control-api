# Etapa 1: Build do projeto com Maven e Java 21
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app
COPY . .

# CORREÇÃO: Dá permissão de execução ao Maven Wrapper
RUN chmod +x mvnw

RUN ./mvnw clean package -DskipTests

# Etapa 2: Execução da aplicação
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]