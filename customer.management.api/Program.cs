using Microsoft.EntityFrameworkCore;
using customer.management.data.entity.DbContext;
using customer.management.api.Services;
using System.Linq;
using Microsoft.AspNetCore.Http.HttpResults;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Add CORS - Allow all origins
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        // Allow all origins, headers, and methods
        // Note: AllowAnyOrigin() cannot be used with AllowCredentials()
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

AppContext.SetSwitch("Npgsql.DisableIPv6", true);
// Add Entity Framework
builder.Services.AddDbContext<CustomerManagementDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    
    // Normalize connection string - fix SSL Mode format for Npgsql
    if (!string.IsNullOrEmpty(connectionString))
    {
        // Replace "SSL Mode=" with "SslMode=" (Npgsql format)
        connectionString = connectionString.Replace("SSL Mode=", "SslMode=");
        
        // Try to resolve hostname to IPv4 to avoid IPv6 issues
        try
        {
            var hostMatch = System.Text.RegularExpressions.Regex.Match(connectionString, @"Host=([^;]+)");
            if (hostMatch.Success)
            {
                var hostname = hostMatch.Groups[1].Value;
                // Resolve to IPv4 only
                var addresses = System.Net.Dns.GetHostAddresses(hostname);
                var ipv4Address = addresses.FirstOrDefault(ip => ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);
                
                if (ipv4Address != null)
                {
                    connectionString = connectionString.Replace($"Host={hostname}", $"Host={ipv4Address}");
                    Console.WriteLine($"Resolved {hostname} to IPv4: {ipv4Address}");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warning: Could not resolve hostname to IPv4: {ex.Message}");
        }
    }
    AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
    AppContext.SetSwitch("Npgsql.DisableIPv6", true);

    // Configure Npgsql with SSL settings for Supabase
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null);
    });
    
    // Log connection string (without password) for debugging
    if (!string.IsNullOrEmpty(connectionString))
    {
        var masked = connectionString.Contains("Password=") 
            ? connectionString.Substring(0, connectionString.IndexOf("Password=")) + "Password=***" 
            : connectionString;
        Console.WriteLine($"Database connection string configured: {masked}");
    }
    else
    {
        Console.WriteLine("WARNING: Connection string is null or empty!");
    }
});

// Add Data Seeding Service
builder.Services.AddScoped<DataSeedingService>();

var app = builder.Build();

// Configure the HTTP request pipeline.

// Enable routing first
app.UseRouting();

// Enable CORS - after routing, before authorization
app.UseCors("AllowReactApp");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Disable HTTPS redirection on Fly.io (handled at edge)
// app.UseHttpsRedirection();

app.UseAuthorization();

// Add a simple health check endpoint (no database required)
app.MapGet("/health", () => new { status = "ok", timestamp = DateTime.UtcNow })
    .WithTags("Health")
    .AllowAnonymous();

// Diagnostic endpoint to check connection string (without password)
app.MapGet("/config-check", (IConfiguration config) =>
{
    var connString = config.GetConnectionString("DefaultConnection");
    if (string.IsNullOrEmpty(connString))
    {
        return Results.Json(new { 
            status = "error", 
            message = "Connection string is null or empty",
            hasConnectionString = false
        }, statusCode: 500);
    }
    
    // Mask password in connection string for security
    var maskedConnString = connString;
    if (connString.Contains("Password="))
    {
        var parts = connString.Split(';');
        maskedConnString = string.Join(";", parts.Select(p => 
            p.StartsWith("Password=") ? "Password=***" : p));
    }
    
    return Results.Json(new { 
        status = "ok", 
        hasConnectionString = true,
        connectionStringPreview = maskedConnString,
        connectionStringLength = connString.Length
    });
}).AllowAnonymous();

app.MapControllers();
app.MapGet("/db-test", async (CustomerManagementDbContext db) =>
{
    try
    {
        // Try to open connection to get detailed error
        await db.Database.OpenConnectionAsync();
        var canConnect = await db.Database.CanConnectAsync();
        
        if (canConnect)
        {
            return Results.Json(new { 
                status = "connected", 
                message = "Database connection successful",
                timestamp = DateTime.UtcNow 
            });
        }
        else
        {
            return Results.Json(new { 
                status = "failed", 
                message = "Cannot connect to database (CanConnectAsync returned false)",
                timestamp = DateTime.UtcNow 
            }, statusCode: 500);
        }
    }
    catch (Npgsql.NpgsqlException npgsqlEx)
    {
        return Results.Json(new { 
            status = "error", 
            message = "PostgreSQL connection error",
            error = npgsqlEx.Message,
            sqlState = npgsqlEx.SqlState,
            innerException = npgsqlEx.InnerException?.Message,
            timestamp = DateTime.UtcNow 
        }, statusCode: 500);
    }
    catch (Exception ex)
    {
        return Results.Json(new { 
            status = "error", 
            message = ex.GetType().Name,
            error = ex.Message,
            innerException = ex.InnerException?.Message,
            stackTrace = ex.StackTrace?.Split('\n').Take(5),
            timestamp = DateTime.UtcNow 
        }, statusCode: 500);
    }
}).AllowAnonymous();

// Seed data on startup with retry logic
_ = Task.Run(async () =>
{
    const int maxRetries = 10;
    const int delaySeconds = 5;
    
    for (int i = 0; i < maxRetries; i++)
    {
        try
        {
            using var scope = app.Services.CreateScope();
            var seedingService = scope.ServiceProvider.GetRequiredService<DataSeedingService>();
            
            // Test connection first
            if (await seedingService.TestConnectionAsync())
            {
                await seedingService.SeedDataAsync();
                Console.WriteLine("Data seeding completed successfully.");
                return;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Attempt {i + 1}/{maxRetries}: Database not ready yet. Error: {ex.Message}");
            if (i < maxRetries - 1)
            {
                await Task.Delay(TimeSpan.FromSeconds(delaySeconds));
            }
            else
            {
                Console.WriteLine($"Failed to seed data after {maxRetries} attempts. Application will continue without seeded data.");
            }
        }
    }
});

app.Run();
