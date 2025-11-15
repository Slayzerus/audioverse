using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using AudioVerse.Identity.Persistence;
using AudioVerse.Domain.Entities;
using Microsoft.AspNetCore.Server.Kestrel.Https;
using System.Security.Cryptography.X509Certificates;
using Serilog;
using AudioVerse.IdentityServer.Middleware;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<IdentityDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgresConnection"));
    options.UseOpenIddict(); 
});

builder.Services.AddIdentity<UserProfile, IdentityRole<int>>()
    .AddEntityFrameworkStores<IdentityDbContext>()
    .AddDefaultTokenProviders();

//Logging - Serilog
var logger = new LoggerConfiguration()
    .WriteTo.Console()
    .Enrich.FromLogContext()
    .MinimumLevel.Information()
    .CreateLogger();

Log.Logger = logger;
builder.Host.UseSerilog();


//Identity - OpenId
builder.Services.AddOpenIddict()
    .AddCore(options =>
    {
        options.UseEntityFrameworkCore()
               .UseDbContext<IdentityDbContext>();
    })
    .AddServer(options =>
    {
        options.SetTokenEndpointUris("/connect/token");
        options.AllowPasswordFlow();
        options.AllowRefreshTokenFlow();
        options.AcceptAnonymousClients();
        options.UseAspNetCore()
               .EnableTokenEndpointPassthrough();
        options.AddDevelopmentEncryptionCertificate()
               .AddDevelopmentSigningCertificate();
    })
    .AddValidation(options =>
    {
        options.UseLocalServer();
        options.UseAspNetCore();
    });

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "http://localhost:5001";
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Secret"])),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

//CORS
var MyAllowSpecificOrigins = "CorsPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy.WithOrigins("https://audioverse.io")  // 🔹 Pozwól na połączenia tylko z tej domeny
                  .AllowAnyMethod()                     // 🔹 Zezwalaj na dowolne metody (GET, POST, PUT, DELETE)
                  .AllowAnyHeader()                     // 🔹 Zezwalaj na dowolne nagłówki
                  .AllowCredentials();                  // 🔹 Jeśli używasz sesji/cookie
        });
});


//Kestrel
builder.WebHost.ConfigureKestrel(options =>
{
    int httpPort = int.TryParse(Environment.GetEnvironmentVariable("Kestrel__HttpPort"), out var hPort) ? hPort : 5002;
    int httpsPort = int.TryParse(Environment.GetEnvironmentVariable("Kestrel__HttpsPort"), out var sPort) ? sPort : 5003;

    string certPath = Environment.GetEnvironmentVariable("Kestrel__Certificates__Default__Path") ?? "/certs/fullchain.pem";
    string keyPath = Environment.GetEnvironmentVariable("Kestrel__Certificates__Default__KeyPath") ?? "/certs/privkey.pem";

    options.ListenAnyIP(httpPort); // HTTP

    options.ListenAnyIP(httpsPort, listenOptions =>
    {
        try
        {
            var certificate = X509Certificate2.CreateFromPemFile(certPath, keyPath);
            listenOptions.UseHttps(new HttpsConnectionAdapterOptions
            {
                ServerCertificate = certificate
            });

            Console.WriteLine($"Załadowano certyfikat HTTPS: {certPath}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Błąd ładowania certyfikatu HTTPS: {ex.Message}");
            throw;
        }
    }); // HTTPS
});

var app = builder.Build();

//CORS
app.UseCors(MyAllowSpecificOrigins);

//Automigration
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
    dbContext.Database.Migrate();
}

//Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    //Remove after testing
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 🔥 Middleware globalnej obsługi wyjątków
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSerilogRequestLogging(); // Logowanie requestów

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
