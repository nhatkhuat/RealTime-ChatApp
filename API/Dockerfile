# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj(s) and restore first (layer caching)
COPY . ./
RUN dotnet restore API.csproj

# Build + publish
RUN dotnet publish API.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "API.dll"]
