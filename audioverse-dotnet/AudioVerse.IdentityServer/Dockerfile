# AudioVerse.IdentityServer
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 5002
ENV DOTNET_EnableDiagnostics=0
ENV DOTNET_gcServer=0

# Etap budowania
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Kopiujemy całość projektu zamiast pojedynczych plików
COPY ./ ./
RUN dotnet restore "AudioVerse.IdentityServer/AudioVerse.IdentityServer.csproj"

# Przechodzimy do katalogu aplikacji i budujemy projekt
WORKDIR "/src/AudioVerse.IdentityServer"
RUN dotnet publish "AudioVerse.IdentityServer.csproj" -c Release -o /app/publish

# Etap uruchamiania
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AudioVerse.IdentityServer.dll"]
