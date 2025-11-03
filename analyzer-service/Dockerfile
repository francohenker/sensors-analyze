FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copiar el archivo Go
COPY analizerService.go .

# Inicializar módulo Go
RUN go mod init analyzer-service

# Compilar la aplicación
RUN go build -o analyzer analizerService.go

# Etapa final con imagen más pequeña
FROM alpine:latest

# Instalar ca-certificates para HTTPS requests
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copiar el binario compilado
COPY --from=builder /app/analyzer .

# Comando para ejecutar la aplicación
CMD ["./analyzer"]
