FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 5000
EXPOSE 5001

# Instalacja ffmpeg (wymagane przez HlsTranscoderService)
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Etap budowania
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Kopiujemy całość projektu zamiast pojedynczych plików
COPY ./ ./
RUN dotnet restore "AudioVerse.API/AudioVerse.API.csproj"

# Przechodzimy do katalogu aplikacji i budujemy projekt
WORKDIR "/src/AudioVerse.API"
RUN dotnet publish "AudioVerse.API.csproj" -c Release -o /app/publish

# Etap uruchamiania
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AudioVerse.API.dll"]
