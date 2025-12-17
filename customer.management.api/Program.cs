using Microsoft.EntityFrameworkCore;
using customer.management.data.entity.DbContext;
using customer.management.api.Services;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        // Get allowed origins from configuration or use defaults
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
            ?? new[] 
            {
                "http://localhost:5173", 
                "http://localhost:3000", 
                "https://localhost:4372",
                "http://localhost:80", 
                "http://frontend:5173", 
                "http://frontend:80"
            };
        
        // Add Vercel URL if configured via environment variable
        // For Vercel preview deployments, add each URL individually or use Cors:AllowAllOrigins
        var vercelUrl = builder.Configuration["VercelUrl"];
        if (!string.IsNullOrEmpty(vercelUrl))
        {
            var originsList = allowedOrigins.ToList();
            originsList.Add(vercelUrl);
            allowedOrigins = originsList.ToArray();
        }
        
        // For production, allow all origins if configured (useful for Vercel preview deployments)
        // Note: This is less secure but flexible. Use specific origins when possible.
        var allowAllOrigins = builder.Configuration.GetValue<bool>("Cors:AllowAllOrigins", false);
        
        if (allowAllOrigins)
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        
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

// Add Entity Framework
builder.Services.AddDbContext<CustomerManagementDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Data Seeding Service
builder.Services.AddScoped<DataSeedingService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable CORS
app.UseCors("AllowReactApp");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

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
