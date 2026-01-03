using Microsoft.EntityFrameworkCore;
using customer.management.data.entity.DbContext;
using customer.management.api.Services;
using customer.management.api.Interfaces;
using System.Linq;
using Microsoft.AspNetCore.Http.HttpResults;
using Npgsql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.CookiePolicy;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Add CORS - Allow specific origins with credentials
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        // Must specify exact origins when using AllowCredentials()
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() 
            ?? new[] { "http://localhost:5173", "http://localhost:3000", "https://localhost:5173" };
        
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for cookies
    });
});

// Configure Cookie Policy
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.HttpOnly = HttpOnlyPolicy.Always;
    options.Secure = CookieSecurePolicy.SameAsRequest; // Use Always in production with HTTPS
    // Note: SameSite is set per-cookie in CookieOptions, not in CookiePolicyOptions
});

// Add JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "CustomerManagementAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "CustomerManagementClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero // Remove delay of token expiration
    };
    
    // Extract token from cookie if not in Authorization header
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // Try to get token from cookie if not in header
            if (string.IsNullOrEmpty(context.Token))
            {
                context.Token = context.Request.Cookies["accessToken"];
            }
            return Task.CompletedTask;
        }
    };
});

// Add Authorization
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("SalesManagerOrAdmin", policy => policy.RequireRole("Admin", "SalesManager"));
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
    })
    .UseSnakeCaseNamingConvention(); // Convert all table and column names to snake_case
    
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

// Add Services
builder.Services.AddScoped<ICashFlowService, CashFlowService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ISalesService, SalesService>();
builder.Services.AddScoped<IExpenseService, ExpenseService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

var app = builder.Build();

// Configure the HTTP request pipeline.

// Enable routing first
app.UseRouting();

// Enable CORS - after routing, before authorization
app.UseCors("AllowReactApp");

// Use Cookie Policy
app.UseCookiePolicy();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Disable HTTPS redirection on Fly.io (handled at edge)
// app.UseHttpsRedirection();

// Authentication must come before Authorization
app.UseAuthentication();
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

app.Run();
