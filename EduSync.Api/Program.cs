using System;
using System.Text;
using System.IO;
using Serilog;
using Serilog.Events;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using EduSync.Api.Data;
using EduSync.Api.Services;
using EduSync.Api.Services.Interfaces;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

// Determine environment
string environmentName = builder.Configuration["Environment:Name"] ?? "LocalDevelopment";
bool isLocalDevelopment = environmentName.Equals("LocalDevelopment", StringComparison.OrdinalIgnoreCase) || 
                         environmentName.Equals("Development", StringComparison.OrdinalIgnoreCase);
Console.WriteLine($"Application starting in {environmentName} environment");

// Ensure local storage directories exist
EnsureLocalDirectoriesExist(builder.Configuration);

// Add services to the container.
builder.Services.AddControllers();

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "EduSync API", Version = "v1" });

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Configure DbContext with SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    // Use local database connection string
    string connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? 
        "Server=(localdb)\\mssqllocaldb;Database=EduSyncDb;Trusted_Connection=True;MultipleActiveResultSets=true";
    Console.WriteLine("Using local database connection");
    
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        // Add resilience to transient SQL errors
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
    });
});

// Configure JWT Authentication
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
        ValidIssuer = builder.Configuration["Security:Jwt:Issuer"],
        ValidAudience = builder.Configuration["Security:Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Security:Jwt:Key"] ?? throw new InvalidOperationException("JWT key is not configured"))),
        ClockSkew = TimeSpan.Zero // Removes the default 5-minute clock skew
    };
});

// Configure CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        // Explicitly set allowed origins for security
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
        
        // Note: Removed AllowCredentials() as we're using token authentication
    });
});

// Configure logging with Serilog
var logDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Logs");
if (!Directory.Exists(logDir))
{
    Directory.CreateDirectory(logDir);
}

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(
        Path.Combine(logDir, "edusync-.log"),
        rollingInterval: RollingInterval.Day,
        fileSizeLimitBytes: 10 * 1024 * 1024,
        retainedFileCountLimit: 31)
    .CreateLogger();

builder.Host.UseSerilog();

// Register Core Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<IAssessmentService, AssessmentService>();

// Register Local Storage Services
builder.Services.AddScoped<IBlobStorageService, LocalBlobStorageService>();
builder.Services.AddSingleton<IQuizEventService, LocalQuizEventService>();

// Add health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (isLocalDevelopment)
{
    app.UseDeveloperExceptionPage();
}
else
{
    // Configure global exception handler for production
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "EduSync API v1"));

// Use CORS before HTTPS redirection
app.UseCors("ReactApp");

// Only use HTTPS redirection in production
if (!isLocalDevelopment)
{
    app.UseHttpsRedirection();
}

// Use Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map health check endpoint
app.MapHealthChecks("/health");

// Map controllers
app.MapControllers();

// Initialize database if needed
try
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<Program>>();
        
        try
        {
            var dbContext = services.GetRequiredService<ApplicationDbContext>();
            
            // Apply pending migrations
            logger.LogInformation("Applying database migrations...");
            dbContext.Database.Migrate();
            logger.LogInformation("Database migrations applied successfully");
            
            // Add database seeding if needed
            // await DbInitializer.InitializeAsync(dbContext);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred during database migration/initialization");
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"An error occurred during startup: {ex.Message}");
}

// Print startup message
Console.WriteLine($"EduSync API started in {environmentName} environment");

app.Run();

// Helper method to ensure local directories exist
void EnsureLocalDirectoriesExist(IConfiguration configuration)
{
    try 
    {
        // Get paths from configuration
        string? courseMaterialsPath = configuration["Storage:Local:CourseMaterialsPath"];
        string? tempUploadsPath = configuration["Storage:Local:TempUploadsPath"];
        string? eventsPath = configuration["Storage:Local:EventsPath"];
        string logsPath = "Logs";
        
        // Create directories if they don't exist
        if (!string.IsNullOrEmpty(courseMaterialsPath) && !Directory.Exists(courseMaterialsPath))
            Directory.CreateDirectory(courseMaterialsPath);
            
        if (!string.IsNullOrEmpty(tempUploadsPath) && !Directory.Exists(tempUploadsPath)) 
            Directory.CreateDirectory(tempUploadsPath);
            
        if (!string.IsNullOrEmpty(eventsPath) && !Directory.Exists(eventsPath))
            Directory.CreateDirectory(eventsPath);
            
        if (!Directory.Exists(logsPath))
            Directory.CreateDirectory(logsPath);
            
        Console.WriteLine("Local storage directories created/verified successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating local directories: {ex.Message}");
    }
}
