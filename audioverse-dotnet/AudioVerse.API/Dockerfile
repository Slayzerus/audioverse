FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5000
EXPOSE 5001

# Etap budowania
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
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
