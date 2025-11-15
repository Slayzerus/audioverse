
using Microsoft.EntityFrameworkCore;
using NiceToDev.FunZone.Application.Interfaces;
using NiceToDev.FunZone.Application.Services;
using NiceToDev.FunZone.Domain.Repositories;
using NiceToDev.FunZone.Infrastructure.Database;
using NiceToDev.FunZone.Infrastructure.Repositories;

namespace NiceToDev.FunZone.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
            builder.Services.AddHttpClient<SteamApiService>();
            builder.Services.AddHttpClient<IYouTubeService, YouTubeService>();
            builder.Services.AddHttpClient<ITextToSpeechService, TextToSpeechService>();
            builder.Services.AddScoped<IKaraokeService, KaraokeService>();
            builder.Services.AddScoped<IKaraokeRepository, KaraokeRepository>();
            builder.Services.AddDbContext<KaraokeDbContext>(options =>
                options.UseSqlServer(
                    builder.Configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly("NiceToDev.FunZone.API") // Repozytorium migracji ustawione na API
                )
            );


            
            builder.Services.AddScoped<ISteamApiService, SteamApiService>();
            builder.Services.AddOpenApi();
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll",
                    policy =>
                    {
                        policy.AllowAnyOrigin()
                              .AllowAnyMethod()
                              .AllowAnyHeader();
                    });
            });

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
                app.UseSwaggerUI(options =>
                {
                    options.SwaggerEndpoint("/openapi/v1.json", "FunZone API");
                });
            }
            app.UseCors("AllowAll");
            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
