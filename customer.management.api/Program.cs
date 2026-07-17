using System.Text;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using customer.management.data.entity.DbContext;
using customer.management.api.Services;
using customer.management.api.Interfaces;

var builder = WebApplication.CreateBuilder(args);

//
// ----------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------
// ASP.NET Core already loads:
// - appsettings.json
// - appsettings.{Environment}.json
// - Environment Variables (Fly secrets use double underscore: Jwt__Key)
//
// DO NOT manually override unless necessary
//

//
// ----------------------------------------------------
// DATABASE
// ----------------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Database connection string not configured");
}

// Normalize connection string - fix SSL Mode format for Npgsql
connectionString = connectionString.Replace("SSL Mode=", "SslMode=");

// Try to resolve hostname to IPv4 to avoid IPv6 issues
try
{
    var hostMatch = System.Text.RegularExpressions.Regex.Match(connectionString, @"Host=([^;]+)");
    if (hostMatch.Success)
    {
        var hostname = hostMatch.Groups[1].Value;
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

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
AppContext.SetSwitch("Npgsql.DisableIPv6", true);

builder.Services.AddDbContext<CustomerManagementDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null);
    })
    .UseSnakeCaseNamingConvention();
    
    // Log connection string (without password) for debugging
    var masked = connectionString.Contains("Password=") 
        ? connectionString.Substring(0, connectionString.IndexOf("Password=")) + "Password=***" 
        : connectionString;
    Console.WriteLine($"Database connection string configured: {masked}");
});

//
// ----------------------------------------------------
// CORS CONFIGURATION
// ----------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        // Check if we should allow all origins (for debugging - set via environment variable)
        var allowAllOrigins = builder.Configuration.GetValue<bool>("Cors:AllowAllOrigins", false);
        
        if (allowAllOrigins)
        {
            // TEMPORARY: Allow all origins for debugging (remove in production)
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            // Get allowed origins from configuration
            var configuredOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
            
            // Default localhost origins for development
            var localhostOrigins = new[]
            {
                "http://localhost:5173",
                "http://localhost:3000",
                "https://localhost:5173",
                "http://localhost:80"
            };
            
            // Build list of all allowed origins
            var allOrigins = new List<string>(localhostOrigins);
            
            // Add configured origins if any
            if (configuredOrigins != null && configuredOrigins.Length > 0)
            {
                allOrigins.AddRange(configuredOrigins);
            }
            
            // Use SetIsOriginAllowed to dynamically check origins (supports Vercel wildcards)
            policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin))
                    return false;
                
                // Allow exact matches from localhost or configured origins
                if (allOrigins.Contains(origin))
                {
                    return true;
                }
                
                // Allow all Vercel domains (production and preview deployments)
                if (origin.StartsWith("https://") && origin.EndsWith(".vercel.app"))
                {
                    return true;
                }
                
                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        }
    });
});

//
// ----------------------------------------------------
// COOKIE POLICY
// ----------------------------------------------------
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.HttpOnly = HttpOnlyPolicy.Always;
    options.Secure = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
});

// Fly.io / Render terminate TLS at the edge; trust X-Forwarded-Proto so Request.IsHttps is correct
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

//
// ----------------------------------------------------
// JWT CONFIGURATION
// ----------------------------------------------------
var jwtSection = builder.Configuration.GetSection("Jwt");

var jwtKey = jwtSection["Key"] 
    ?? builder.Configuration["JWT_KEY"]  // Alternative env var name
    ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLongForHS256Algorithm!"; // Default fallback

// Log warning if using default key (not set via configuration)
if (jwtSection["Key"] == null && builder.Configuration["JWT_KEY"] == null)
{
    Console.WriteLine("⚠️  ⚠️  ⚠️  WARNING: Using DEFAULT JWT Key! This is INSECURE for production! ⚠️  ⚠️  ⚠️");
    Console.WriteLine("⚠️  Please set Jwt__Key secret in Fly.io:");
    Console.WriteLine("⚠️  fly secrets set Jwt__Key='YourSuperSecretKeyThatIsAtLeast32CharactersLongForHS256Algorithm!' -a customer-management-api-shy-surf-8080");
    Console.WriteLine("⚠️  Or generate a secure key: openssl rand -base64 64");
}

var jwtIssuer = jwtSection["Issuer"] ?? "CustomerManagementAPI";
var jwtAudience = jwtSection["Audience"] ?? "CustomerManagementClient";

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false; // Set to true in production with HTTPS
        options.SaveToken = true;
        // Keep long claim type names so ClaimTypes.NameIdentifier resolves after validation
        options.MapInboundClaims = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,

            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = System.Security.Claims.ClaimTypes.Name,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
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

//
// ----------------------------------------------------
// AUTHORIZATION
// ----------------------------------------------------
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("SalesManagerOrAdmin", policy => policy.RequireRole("Admin", "SalesManager"));
});

//
// ----------------------------------------------------
// SERVICES
// ----------------------------------------------------
builder.Services.AddScoped<ICashFlowService, CashFlowService>();
builder.Services.AddScoped<IUserActivityService, UserActivityService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IProductImageService, ProductImageService>();
builder.Services.AddScoped<ISalesService, SalesService>();
builder.Services.AddScoped<IExpenseService, ExpenseService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

//
// ----------------------------------------------------
// CONTROLLERS & API
// ----------------------------------------------------
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

//
// ----------------------------------------------------
// APP PIPELINE
// ----------------------------------------------------
var app = builder.Build();

var webRootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(webRootPath, "uploads", "products"));

app.UseForwardedHeaders();

// Enable CORS FIRST - must be before UseRouting for preflight requests
app.UseCors("AllowReactApp");

// Enable routing
app.UseRouting();

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

app.UseStaticFiles();

//
// ----------------------------------------------------
// ENDPOINTS
// ----------------------------------------------------
app.MapControllers();

// Health check endpoint (important for Fly.io)
app.MapGet("/health", () => Results.Ok(new { status = "ok", timestamp = DateTime.UtcNow }))
    .WithTags("Health")
    .AllowAnonymous();

// Root endpoint
app.MapGet("/", () => Results.Ok("API is running"))
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

// Database connection test endpoint
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
