# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG APP_VERSION=0.0.0
WORKDIR /src

# Copy solution and project files first for better caching
COPY ["SPS.sln", "./"]
COPY ["SPS.Api/SPS.Api.csproj", "SPS.Api/"]
COPY ["SPS.Application/SPS.Application.csproj", "SPS.Application/"]
COPY ["SPS.Domain/SPS.Domain.csproj", "SPS.Domain/"]
COPY ["SPS.Infrastructure/SPS.Infrastructure.csproj", "SPS.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "SPS.Api/SPS.Api.csproj"

# Copy the rest of the source code
COPY . .

# Build and Publish
WORKDIR "/src/SPS.Api"
RUN dotnet build "SPS.Api.csproj" -c Release -o /app/build
RUN dotnet publish "SPS.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false /p:InformationalVersion=$APP_VERSION

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080

# 安裝字體支援（SkiaSharp 驗證碼圖片需要）+ curl（健康檢查用）+ docker CLI（nginx reload 用）
RUN apt-get update -o Acquire::Retries=3 \
    && apt-get install -y --no-install-recommends \
    fontconfig \
    fonts-dejavu-core \
    curl \
    ca-certificates \
    gnupg \
    lsb-release \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update -o Acquire::Retries=3 \
    && apt-get install -y --no-install-recommends docker-ce-cli \
    && rm -rf /var/lib/apt/lists/* \
    && fc-cache -f -v

COPY --from=build /app/publish .

ENV ConnectionStrings__DefaultConnection="" \
    ConnectionStrings__Redis="" \
    JWT_Setting__Key="" \
    JWT_Setting__Issuer="" \
    JWT_Setting__Audience="" \
    JWT_Setting__Expires="" \
    CORS_Setting__WithOrigins="" \
    FileStorage__RootPath="Uploads" \
    FileStorage__MaxFileSize=104857600 \
    FileStorage__AllowedExtensions="" \
    FileStorage__EnableDeduplication=true \
    FileStorage__BufferSize=81920 \
    Email_Setting__SmtpServer="" \
    Email_Setting__SmtpPort="" \
    Email_Setting__SmtpUsername="" \
    Email_Setting__SmtpPassword="" \
    Email_Setting__FromEmail="" \
    Email_Setting__FromName="" \
    Email_Setting__EnableSSL=true \
    Logging__LogLevel__Default="Information" \
    Logging__LogLevel__Microsoft.EntityFrameworkCore="Warning" \
    Logging__LogLevel__Microsoft.AspNetCore="Warning" \
    GoogleAnalytics__CredentialsJson="" \
    GoogleAnalytics__PropertyId="" \
    AllowedHosts="*"


ENTRYPOINT ["dotnet", "SPS.Api.dll"]
