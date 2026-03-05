using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;

namespace AudioVerse.API.Seed
{
    public static class IdentitySeeder
    {
        public static async Task SeedAdminUser(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<UserProfile>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();
            var dbContext = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

            string adminEmail = "itsnicetodev@gmail.com";
            string adminPassword = "Admin@123"; // Sprawdz, czy spelnia wymagania Identity

            // ??? Tworzenie roli "Admin"
            if (!await roleManager.RoleExistsAsync("Admin"))
            {
                await roleManager.CreateAsync(new IdentityRole<int>("Admin"));
            }

            // ??? Tworzenie uzytkownika admina
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new UserProfile
                {
                    UserName = "admin",
                    Email = adminEmail,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                    Console.WriteLine("? Uzytkownik admin zostal utworzony i dodany do roli Admin.");
                }
                else
                {
                    // ?? Debugowanie bledów Identity
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    Console.WriteLine($"? Blad podczas tworzenia uzytkownika admin: {errors}");
                    throw new Exception($"Nie udalo sie stworzyc uzytkownika admin: {errors}");
                }
            }
            else
            {
                Console.WriteLine("?? Uzytkownik admin juz istnieje.");
            }

            // Ensure admin has a Contact card (1:1)
            if (adminUser.ContactId == null)
            {
                var existingContact = dbContext.Contacts.FirstOrDefault(c => c.LinkedUserId == adminUser.Id && c.OwnerUserId == adminUser.Id);
                if (existingContact == null)
                {
                    var adminContact = new AudioVerse.Domain.Entities.Contacts.Contact
                    {
                        OwnerUserId = adminUser.Id,
                        LinkedUserId = adminUser.Id,
                        FirstName = "Rados?aw",
                        LastName = "Skrzypczy?ski",
                        DisplayName = "Rados?aw Skrzypczy?ski",
                        DisplayNamePrivate = "Slayzer",
                        Nickname = "Slayzer",
                        ImportSource = AudioVerse.Domain.Enums.ContactImportSource.Manual
                    };
                    adminContact.Emails.Add(new AudioVerse.Domain.Entities.Contacts.ContactEmail { Email = adminEmail, Type = AudioVerse.Domain.Enums.ContactEmailType.Work, IsPrimary = true });
                    dbContext.Contacts.Add(adminContact);
                    await dbContext.SaveChangesAsync();
                    adminUser.ContactId = adminContact.Id;
                    await userManager.UpdateAsync(adminUser);
                    Console.WriteLine("? Utworzono Contact card dla admina.");
                }
                else
                {
                    adminUser.ContactId = existingContact.Id;
                    await userManager.UpdateAsync(adminUser);
                    Console.WriteLine("?? Powiazano istniejacy Contact z adminem.");
                }
            }

            // ??? Seeding PasswordRequirements
            await SeedPasswordRequirements(dbContext);

            // Ensure storage buckets exist based on configuration
            try
            {
                await AudioVerse.Infrastructure.Storage.StorageInitializer.EnsureBucketsAsync(scope.ServiceProvider);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"?? Nie udalo sie utworzyc bucketów: {ex.Message}");
            }

            // Seed first party and start it
            try
            {
                var karaokeRepo = scope.ServiceProvider.GetRequiredService<Domain.Repositories.IKaraokeRepository>();

                // Find admin player's id - create UserProfilePlayer for admin if not exists
                var admin = await userManager.FindByEmailAsync(adminEmail);
                if (admin is null)
                {
                    Console.WriteLine("Admin user not found — skipping party seed");
                    return;
                }

                int organizerPlayerId;
                var existingPlayer = dbContext.UserProfilePlayers.FirstOrDefault(p => p.ProfileId == admin.Id && p.IsPrimary == true);
                if (existingPlayer == null)
                {
                    var newPlayer = new UserProfilePlayer { Name = "Admin", ProfileId = admin.Id, IsPrimary = true };
                    dbContext.UserProfilePlayers.Add(newPlayer);
                    await dbContext.SaveChangesAsync();
                    organizerPlayerId = newPlayer.Id;
                }
                else
                {
                    organizerPlayerId = existingPlayer.Id;
                }

                // Create initial Event and session — OrganizerId is UserProfile.Id
                var existsEvent = dbContext.Events.Any(e => e.Title == "First Event" || e.OrganizerId == admin.Id);
                if (existsEvent)
                {
                    Console.WriteLine("?? 'First Event' already exists, skipping event seed.");
                }
                else
                {
                    var ev = new Event
                    {
                        Title = "First Event",
                        Description = "Seeded first event",
                        OrganizerId = admin.Id,
                        Status = AudioVerse.Domain.Enums.EventStatus.ItsOn,
                        StartTime = DateTime.UtcNow
                    };
                    dbContext.Events.Add(ev);
                    await dbContext.SaveChangesAsync();
                    // If seed poster exists, try to upload it and set as event poster
                try
                {
                    var fileStorage = scope.ServiceProvider.GetService<Infrastructure.Storage.IFileStorage>();
                    var config = scope.ServiceProvider.GetService<Microsoft.Extensions.Configuration.IConfiguration>();
                    var bucket = config? ["StorageOptions:Poster:Bucket"] ?? "event-posters";
                    var seedAttempts = int.TryParse(config?["StorageOptions:Poster:SeedUploadRetryAttempts"], out var sa) ? sa : 3;
                    var seedDelay = int.TryParse(config?["StorageOptions:Poster:SeedUploadInitialDelayMs"], out var sd) ? sd : 500;

                    if (fileStorage != null)
                    {
                        string[] tryPaths = new[] {
                            Path.Combine(AppContext.BaseDirectory, "Seed", "poster.jpg"),
                            Path.Combine(Directory.GetCurrentDirectory(), "Seed", "poster.jpg")
                        };
                        string? posterPath = tryPaths.FirstOrDefault(p => File.Exists(p));
                        if (!string.IsNullOrEmpty(posterPath))
                        {
                            var ext = Path.GetExtension(posterPath) ?? ".jpg";
                            var key = $"posters/{Guid.NewGuid():N}{ext}";
                            int attempt = 0;
                            while (attempt < seedAttempts)
                            {
                                attempt++;
                                try
                                {
                                    await using var fsStream = File.OpenRead(posterPath);
                                    await fileStorage.UploadAsync(bucket, key, fsStream, "image/jpeg");
                                    ev.Poster = key;
                                    break;
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"?? Seed poster upload attempt {attempt} failed: {ex.Message}");
                                    if (attempt >= seedAttempts) break;
                                    try { await Task.Delay(seedDelay); } catch (TaskCanceledException) { }
                                    seedDelay *= 2;
                                }
                            }
                        }
                    }
                }
                catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or IOException) { }

                    var createdEventId = await karaokeRepo.CreateEventAsync(ev);

                    // Create session for event and start it
                    var session = new KaraokeSession
                    {
                        EventId = createdEventId,
                        Name = "First Event Session",
                        CreatedAt = DateTime.UtcNow,
                        StartedAt = DateTime.UtcNow
                    };

                    var sessionId = await karaokeRepo.AddSessionAsync(session);

                    // Create one empty round (no song selected)
                    var round = new KaraokeSessionRound
                    {
                        EventId = createdEventId,
                        SessionId = sessionId,
                        Number = 1,
                        CreatedAt = DateTime.UtcNow,
                        StartTime = DateTime.UtcNow
                    };

                    await karaokeRepo.AddRoundAsync(round);
                    Console.WriteLine("? Zasadzono pierwsza impreze 'First Event' i uruchomiono sesje z jedna runda.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"?? Blad podczas seedowania imprezy: {ex.Message}");
            }
        }

        private static async Task SeedPasswordRequirements(AudioVerseDbContext dbContext)
        {
            // Sprawdz, czy juz istnieja
            if (dbContext.PasswordRequirements.Any())
            {
                Console.WriteLine("?? PasswordRequirements juz istnieja.");
                return;
            }

            var requirements = new List<PasswordRequirements>
            {
                // 1. co najmniej 8 znaków, co najmniej jedna wielka litere, co najmniej jeden znak specjalny
                new PasswordRequirements
                {
                    Id = 1,
                    Description = "Zadanie 1: Co najmniej 8 znaków, wielka litera, znak specjalny",
                    Active = false,
                    MinLength = 8,
                    RequireUppercase = true,
                    RequireSpecialChar = true
                },
                // 2. co najmniej 12 znaków, co najmniej jedna cyfre, co najmniej jeden znak specjalny
                new PasswordRequirements
                {
                    Id = 2,
                    Description = "Zadanie 2: Co najmniej 12 znaków, cyfra, znak specjalny",
                    Active = true,
                    MinLength = 12,
                    RequireDigit = true,
                    RequireSpecialChar = true
                },
                // 3. brak powtarzajacych sie znaków
                new PasswordRequirements
                {
                    Id = 3,
                    Description = "Zadanie 3: Brak powtarzajacych sie znaków",
                    Active = false,
                    MinLength = 8
                },
                // 4. co najmniej jedna wielka litere i 2 cyfry
                new PasswordRequirements
                {
                    Id = 4,
                    Description = "Zadanie 4: Wielka litera i 2 cyfry",
                    Active = false,
                    MinLength = 8,
                    RequireUppercase = true
                },
                // 5. co najmniej jedna mala litere, co najmniej jeden znak specjalny
                new PasswordRequirements
                {
                    Id = 5,
                    Description = "Zadanie 5: Mala litera, znak specjalny",
                    Active = false,
                    MinLength = 8,
                    RequireLowercase = true,
                    RequireSpecialChar = true                    
                },
                // 6. co najmniej 14 znaków, co najmniej jedna cyfre
                new PasswordRequirements
                {
                    Id = 6,
                    Description = "Zadanie 6: Co najmniej 14 znaków, cyfra",
                    Active = false,
                    MinLength = 14,
                    RequireDigit = true
                },
                // 7. co najmniej jedna wielka litere, jedna mala litere i 3 cyfry
                new PasswordRequirements
                {
                    Id = 7,
                    Description = "Zadanie 7: Wielka litera, mala litera, 3 cyfry",
                    Active = false,
                    MinLength = 8,
                    RequireUppercase = true,
                    RequireLowercase = true
                },
                // 8. znaki z kategorii: cyfry, znaki specjalne
                new PasswordRequirements
                {
                    Id = 8,
                    Description = "Zadanie 8: Tylko cyfry i znaki specjalne",
                    Active = false,
                    MinLength = 8
                },
                // 9. znaki z kategorii: wielkie litery, male litery, znaki specjalne
                new PasswordRequirements
                {
                    Id = 9,
                    Description = "Zadanie 9: Tylko litery i znaki specjalne",
                    Active = false,
                    MinLength = 8
                },
                // 10. znaki z kategorii: male litery, cyfry
                new PasswordRequirements
                {
                    Id = 10,
                    Description = "Zadanie 10: Tylko male litery i cyfry",
                    Active = false,
                    MinLength = 8,
                    RequireLowercase = true
                }
            };

            await dbContext.PasswordRequirements.AddRangeAsync(requirements);
            await dbContext.SaveChangesAsync();
            Console.WriteLine("? Wstawiono 10 zadan PasswordRequirements. Zadanie 2 jest aktywne.");
        }
    }
}
