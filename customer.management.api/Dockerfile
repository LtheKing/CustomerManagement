# Stage 1: Build the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files first (for better Docker layer caching)
COPY customer.management.api/customer.management.api.csproj customer.management.api/
COPY customer.management.data.entity/customer.management.data.entity.csproj customer.management.data.entity/
RUN dotnet restore customer.management.api/customer.management.api.csproj

# Copy full source into the correct project folders (do not nest under WORKDIR)
COPY customer.management.api/ customer.management.api/
COPY customer.management.data.entity/ customer.management.data.entity/

WORKDIR /src/customer.management.api
RUN dotnet publish customer.management.api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Create the runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN useradd -m -u 1000 -s /bin/bash dotnetuser

WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p /app/wwwroot/uploads/products && chown -R dotnetuser:dotnetuser /app
USER dotnetuser

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=8080
ENV DOTNET_EnableDiagnostics=0
ENV DOTNET_gcServer=1
EXPOSE 8080

ENTRYPOINT ["dotnet", "customer.management.api.dll"]
