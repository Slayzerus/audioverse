using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AudioVerse.Domain.Entities;
using OpenIddict.EntityFrameworkCore.Models;

namespace AudioVerse.Identity.Persistence
{
    public class IdentityDbContext : IdentityDbContext<UserProfile, IdentityRole<int>, int>
    {
        public IdentityDbContext(DbContextOptions<IdentityDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.UseOpenIddict(); // 🔥 Konfiguracja OpenIddict w bazie
        }
    }
}
