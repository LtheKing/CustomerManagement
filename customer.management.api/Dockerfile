# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081


# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project files
COPY ["customer.management.api/customer.management.api.csproj", "customer.management.api/"]
COPY ["customer.management.data.entity/customer.management.data.entity.csproj", "customer.management.data.entity/"]

# Restore dependencies
WORKDIR "/src/customer.management.api"
RUN dotnet restore "customer.management.api.csproj"

# Copy everything else and build
COPY customer.management.api/ .
COPY customer.management.data.entity/ ../customer.management.data.entity/
RUN dotnet build "customer.management.api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
WORKDIR "/src/customer.management.api"
RUN dotnet publish "customer.management.api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "customer.management.api.dll"]