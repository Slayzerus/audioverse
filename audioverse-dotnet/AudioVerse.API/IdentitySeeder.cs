using AudioVerse.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace AudioVerse.API
{
    public static class IdentitySeeder
    {
        public static async Task SeedAdminUser(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<UserProfile>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();

            string adminEmail = "itsnicetodev@gmail.com";
            string adminPassword = "Admin@123"; // Sprawdź, czy spełnia wymagania Identity

            // 🛠️ Tworzenie roli "Admin"
            if (!await roleManager.RoleExistsAsync("Admin"))
            {
                await roleManager.CreateAsync(new IdentityRole<int>("Admin"));
            }

            // 🛠️ Tworzenie użytkownika admina
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
                    Console.WriteLine("✅ Użytkownik admin został utworzony i dodany do roli Admin.");
                }
                else
                {
                    // 🔴 Debugowanie błędów Identity
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    Console.WriteLine($"❌ Błąd podczas tworzenia użytkownika admin: {errors}");
                    throw new Exception($"Nie udało się stworzyć użytkownika admin: {errors}");
                }
            }
            else
            {
                Console.WriteLine("ℹ️ Użytkownik admin już istnieje.");
            }
        }
    }

}
