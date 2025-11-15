# Pobieramy obraz .NET 9 jako bazę dla aplikacji
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5001

# Etap budowania
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
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
