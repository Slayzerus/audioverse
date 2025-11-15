using AudioVerse.API.Middleware;
using AudioVerse.Application;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities;
using AudioVerse.Infrastructure;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Server.Kestrel.Https;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Serilog;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;

namespace AudioVerse.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder();   
            Console.WriteLine("Starting AudioVerse.API");

            builder.Services.AddInfrastructure(builder.Configuration);
            builder.Services.AddApplication(builder.Configuration);

            // 📌 Rejestracja CQRS + MediatR
            builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(GetAllSongsQuery).Assembly));

            // 📌 Kontrolery i Swagger
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            //Logging - Serilog
            var logger = new LoggerConfiguration()
                .WriteTo.Console()
                .Enrich.FromLogContext()
                .MinimumLevel.Information()
                .CreateLogger();

            Log.Logger = logger;
            builder.Host.UseSerilog((context, services, configuration) =>
            {
                configuration
                    .ReadFrom.Configuration(context.Configuration) // Pozwala na konfigurację z `appsettings.json`
                    .ReadFrom.Services(services) // Integracja z ASP.NET DI
                    .WriteTo.Console() // Logowanie do konsoli (ważne dla Docker)
                    .Enrich.FromLogContext()
                    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning) // Wyłącz logi ASP.NET
                    .MinimumLevel.Information();
            });
            Log.Information("Application starting...");


            //CORS
            var MyAllowSpecificOrigins = "CorsPolicy";
            builder.Services.AddCors(options =>
            {
                options.AddPolicy(name: MyAllowSpecificOrigins,
                    policy =>
                    {
                        policy.WithOrigins("https://audioverse.io", "http://localhost:5173")  // 🔹 Pozwól na połączenia tylko z tej domeny
                          .AllowAnyMethod()                     // 🔹 Zezwalaj na dowolne metody (GET, POST, PUT, DELETE)
                          .AllowAnyHeader()
                          .AllowCredentials();
                    });
            });

            //Kestrel
            builder.WebHost.ConfigureKestrel(options =>
            {
                int httpPort = int.TryParse(Environment.GetEnvironmentVariable("Kestrel__HttpPort"), out var hPort) ? hPort : 5000;
                int httpsPort = int.TryParse(Environment.GetEnvironmentVariable("Kestrel__HttpsPort"), out var sPort) ? sPort : 5001;

                string certPath = Environment.GetEnvironmentVariable("Kestrel__Certificates__Default__Path") ?? "/certs/fullchain.pem";
                string keyPath = Environment.GetEnvironmentVariable("Kestrel__Certificates__Default__KeyPath") ?? "/certs/privkey.pem";

                options.AllowSynchronousIO = true;
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

                        Console.WriteLine($"✅✅✅ Załadowano certyfikat HTTPS: {certPath}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"❌❌❌ Błąd ładowania certyfikatu HTTPS: {ex.Message}");
                        throw;
                    }
                }); // HTTPS
            });


            // 🛠️ Rejestracja Identity
            builder.Services.AddIdentity<UserProfile, IdentityRole<int>>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireUppercase = true;
                options.User.RequireUniqueEmail = true;
            })
                .AddEntityFrameworkStores<AudioVerseDbContext>()
                .AddDefaultTokenProviders();

            // 🛠️ Rejestracja usług Identity
            builder.Services.AddScoped<UserManager<UserProfile>>();
            builder.Services.AddScoped<RoleManager<IdentityRole<int>>>();

            var app = builder.Build();

            //CORS
            app.UseCors(MyAllowSpecificOrigins);

            //Automigration
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
                dbContext.Database.Migrate();
            }

            async Task SeedDataAsync()
            {
                using var scope = app.Services.CreateScope();
                var services = scope.ServiceProvider;
                await IdentitySeeder.SeedAdminUser(services);
            }

            // Uruchamiamy seedowanie danych i czekamy na zakończenie
            Task.Run(SeedDataAsync).Wait();


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

            //Middleware
            app.UseMiddleware<JwtMiddleware>();            
            //app.UseMiddleware<ExceptionHandlingMiddleware>();

            //Logging
            app.UseSerilogRequestLogging();

            app.UseAuthorization();
            app.MapControllers();
            app.Run();

            Log.Information("Application started");
        }
    }
}
