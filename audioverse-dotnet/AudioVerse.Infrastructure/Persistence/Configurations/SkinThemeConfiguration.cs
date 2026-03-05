using AudioVerse.Domain.Entities.Design;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class SkinThemeConfiguration : IEntityTypeConfiguration<SkinTheme>
    {
        public void Configure(EntityTypeBuilder<SkinTheme> builder)
        {
            builder.ToTable("SkinThemes");

            builder.HasKey(s => s.Id);

            builder.Property(s => s.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(s => s.Emoji)
                .IsRequired()
                .HasMaxLength(10);

            builder.Property(s => s.Description)
                .HasMaxLength(500);

            builder.Property(s => s.BodyBackground)
                .HasMaxLength(500);

            builder.Property(s => s.Vars)
                .IsRequired()
                .HasColumnType("text");

            builder.HasIndex(s => s.SortOrder);
            builder.HasIndex(s => s.Name).IsUnique();

            builder.HasQueryFilter(s => !s.IsDeleted);

            builder.HasData(
                new SkinTheme
                {
                    Id = 1,
                    Name = "Default Dark",
                    Emoji = "🌙",
                    Description = "Domyślny ciemny motyw",
                    IsDark = true,
                    BodyBackground = "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
                    Vars = "{\"--bg-primary\":\"#1a1a2e\",\"--bg-secondary\":\"#16213e\",\"--bg-card\":\"#0f3460\",\"--text-primary\":\"#e0e0e0\",\"--text-secondary\":\"#a0a0a0\",\"--accent\":\"#e94560\",\"--accent-hover\":\"#ff6b6b\",\"--border\":\"#2a2a4a\"}",
                    IsActive = true,
                    IsSystem = true,
                    SortOrder = 1,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new SkinTheme
                {
                    Id = 2,
                    Name = "Default Light",
                    Emoji = "☀️",
                    Description = "Domyślny jasny motyw",
                    IsDark = false,
                    BodyBackground = "linear-gradient(135deg, #f5f7fa, #c3cfe2)",
                    Vars = "{\"--bg-primary\":\"#ffffff\",\"--bg-secondary\":\"#f8f9fa\",\"--bg-card\":\"#ffffff\",\"--text-primary\":\"#212529\",\"--text-secondary\":\"#6c757d\",\"--accent\":\"#0d6efd\",\"--accent-hover\":\"#0b5ed7\",\"--border\":\"#dee2e6\"}",
                    IsActive = true,
                    IsSystem = true,
                    SortOrder = 2,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new SkinTheme
                {
                    Id = 3,
                    Name = "Neon Event",
                    Emoji = "🎉",
                    Description = "Neonowy motyw imprezowy",
                    IsDark = true,
                    BodyBackground = "linear-gradient(135deg, #0a0a0a, #1a0030, #000033)",
                    Vars = "{\"--bg-primary\":\"#0a0a0a\",\"--bg-secondary\":\"#1a0030\",\"--bg-card\":\"#1a1a2e\",\"--text-primary\":\"#f0f0f0\",\"--text-secondary\":\"#b0b0b0\",\"--accent\":\"#ff00ff\",\"--accent-hover\":\"#ff66ff\",\"--border\":\"#3a0060\"}",
                    IsActive = true,
                    IsSystem = true,
                    SortOrder = 3,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
                ,
                // Additional sensual skins seeded
                new SkinTheme { Id = 4, Name = "Velvet Night", Emoji = "🖤", Description = "Gładkie, aksamitne odcienie", IsDark = true, BodyBackground = "linear-gradient(180deg,#0b0711,#2a2130)", Vars = "{\"--bg-primary\":\"#0b0711\",\"--bg-secondary\":\"#1a1220\",\"--bg-card\":\"#241628\",\"--text-primary\":\"#fdeff2\",\"--text-secondary\":\"#d8b7c9\",\"--accent\":\"#ff6fa3\",\"--accent-hover\":\"#ff94c2\",\"--border\":\"#3b2130\"}", IsActive = true, IsSystem = true, SortOrder = 4, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 5, Name = "Saffron Glow", Emoji = "🟠", Description = "Ciepłe, przyprawowe tony", IsDark = false, BodyBackground = "linear-gradient(180deg,#fff5e6,#fff0d1)", Vars = "{\"--bg-primary\":\"#fff8f0\",\"--bg-secondary\":\"#fff2e0\",\"--bg-card\":\"#fff1dd\",\"--text-primary\":\"#2b2b2b\",\"--text-secondary\":\"#5a4a3a\",\"--accent\":\"#ff8a00\",\"--accent-hover\":\"#ffa733\",\"--border\":\"#e6c9b0\"}", IsActive = true, IsSystem = true, SortOrder = 5, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 6, Name = "Crimson Silk", Emoji = "🩸", Description = "Zmysłowa czerwień i jedwab", IsDark = true, BodyBackground = "linear-gradient(180deg,#2b0a0a,#3b0f0f)", Vars = "{\"--bg-primary\":\"#1b0a0a\",\"--bg-secondary\":\"#2b0f0f\",\"--bg-card\":\"#3a1414\",\"--text-primary\":\"#fff2f2\",\"--text-secondary\":\"#f0b6b6\",\"--accent\":\"#d32f2f\",\"--accent-hover\":\"#ff5252\",\"--border\":\"#4a1a1a\"}", IsActive = true, IsSystem = true, SortOrder = 6, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 7, Name = "Amber Kiss", Emoji = "💛", Description = "Miodowe, przytulne barwy", IsDark = false, BodyBackground = "linear-gradient(180deg,#fff9e6,#fff1cc)", Vars = "{\"--bg-primary\":\"#fffaf0\",\"--bg-secondary\":\"#fff3d9\",\"--bg-card\":\"#fff1cc\",\"--text-primary\":\"#231f20\",\"--text-secondary\":\"#7a5a2b\",\"--accent\":\"#ffb300\",\"--accent-hover\":\"#ffc633\",\"--border\":\"#f0d9b5\"}", IsActive = true, IsSystem = true, SortOrder = 7, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 8, Name = "Velvet Plum", Emoji = "🍇", Description = "Głębokie purpury", IsDark = true, BodyBackground = "linear-gradient(180deg,#150018,#2a002b)", Vars = "{\"--bg-primary\":\"#0f0011\",\"--bg-secondary\":\"#210019\",\"--bg-card\":\"#2b001f\",\"--text-primary\":\"#fff7fb\",\"--text-secondary\":\"#d8bfe6\",\"--accent\":\"#9b59b6\",\"--accent-hover\":\"#c17bdc\",\"--border\":\"#3a1630\"}", IsActive = true, IsSystem = true, SortOrder = 8, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 9, Name = "Rose Whisper", Emoji = "🌹", Description = "Subtelne róże i beże", IsDark = false, BodyBackground = "linear-gradient(180deg,#fff6f8,#fff1f3)", Vars = "{\"--bg-primary\":\"#fff8f9\",\"--bg-secondary\":\"#fff2f4\",\"--bg-card\":\"#fff1f2\",\"--text-primary\":\"#2b1f22\",\"--text-secondary\":\"#8b5b63\",\"--accent\":\"#d81b60\",\"--accent-hover\":\"#ff4081\",\"--border\":\"#f3d7db\"}", IsActive = true, IsSystem = true, SortOrder = 9, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 10, Name = "Midnight Bloom", Emoji = "🌺", Description = "Kwiatowy motyw nocny", IsDark = true, BodyBackground = "linear-gradient(180deg,#0b0820,#241238)", Vars = "{\"--bg-primary\":\"#070614\",\"--bg-secondary\":\"#1a0f25\",\"--bg-card\":\"#2b142b\",\"--text-primary\":\"#fff6f8\",\"--text-secondary\":\"#e6bfd6\",\"--accent\":\"#ff4081\",\"--accent-hover\":\"#ff79a8\",\"--border\":\"#3a0e2a\"}", IsActive = true, IsSystem = true, SortOrder = 10, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 11, Name = "Moonlit Amber", Emoji = "🌕", Description = "Ciepła noc pod księżycem", IsDark = true, BodyBackground = "linear-gradient(180deg,#0d0810,#2b1a09)", Vars = "{\"--bg-primary\":\"#0b0908\",\"--bg-secondary\":\"#22170f\",\"--bg-card\":\"#2f1f14\",\"--text-primary\":\"#fff7e6\",\"--text-secondary\":\"#ead3b8\",\"--accent\":\"#ffb74d\",\"--accent-hover\":\"#ffd27a\",\"--border\":\"#3a2a1f\"}", IsActive = true, IsSystem = true, SortOrder = 11, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 12, Name = "Silk Noir", Emoji = "🕶️", Description = "Elegancka czerń i kontrasty", IsDark = true, BodyBackground = "linear-gradient(180deg,#000,#1a1a1a)", Vars = "{\"--bg-primary\":\"#000000\",\"--bg-secondary\":\"#0f0f0f\",\"--bg-card\":\"#121212\",\"--text-primary\":\"#f8f8f8\",\"--text-secondary\":\"#bfbfbf\",\"--accent\":\"#9e9e9e\",\"--accent-hover\":\"#cfcfcf\",\"--border\":\"#222222\"}", IsActive = true, IsSystem = true, SortOrder = 12, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 13, Name = "Cocoa Mist", Emoji = "🍫", Description = "Czekoladowe tony", IsDark = false, BodyBackground = "linear-gradient(180deg,#fff7f3,#f7ede6)", Vars = "{\"--bg-primary\":\"#fff9f6\",\"--bg-secondary\":\"#fff2ee\",\"--bg-card\":\"#f6e8e0\",\"--text-primary\":\"#2b1e1c\",\"--text-secondary\":\"#7a5a4f\",\"--accent\":\"#6d4c41\",\"--accent-hover\":\"#8d6e63\",\"--border\":\"#ecdacb\"}", IsActive = true, IsSystem = true, SortOrder = 13, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 14, Name = "Opal Dusk", Emoji = "💎", Description = "Migoczące odcienie", IsDark = true, BodyBackground = "linear-gradient(180deg,#061018,#12202a)", Vars = "{\"--bg-primary\":\"#061018\",\"--bg-secondary\":\"#0f2530\",\"--bg-card\":\"#172a34\",\"--text-primary\":\"#f3fbff\",\"--text-secondary\":\"#bcd7e6\",\"--accent\":\"#7fd3ff\",\"--accent-hover\":\"#b7f0ff\",\"--border\":\"#13303a\"}", IsActive = true, IsSystem = true, SortOrder = 14, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 15, Name = "Desert Rose", Emoji = "🏜️", Description = "Pustynne, zmysłowe barwy", IsDark = false, BodyBackground = "linear-gradient(180deg,#fff8f2,#ffeedb)", Vars = "{\"--bg-primary\":\"#fffaf5\",\"--bg-secondary\":\"#fff2e8\",\"--bg-card\":\"#fff0de\",\"--text-primary\":\"#2b1f18\",\"--text-secondary\":\"#8a6f62\",\"--accent\":\"#d88b5f\",\"--accent-hover\":\"#ffa66e\",\"--border\":\"#edd6c2\"}", IsActive = true, IsSystem = true, SortOrder = 15, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 16, Name = "Moonshadow", Emoji = "🌒", Description = "Chłodne, miękkie cienie", IsDark = true, BodyBackground = "linear-gradient(180deg,#030412,#0b1220)", Vars = "{\"--bg-primary\":\"#030412\",\"--bg-secondary\":\"#0b1220\",\"--bg-card\":\"#131827\",\"--text-primary\":\"#e8f0ff\",\"--text-secondary\":\"#aabddf\",\"--accent\":\"#5ea3ff\",\"--accent-hover\":\"#8fc3ff\",\"--border\":\"#1d2b3a\"}", IsActive = true, IsSystem = true, SortOrder = 16, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 17, Name = "Rosewood", Emoji = "🪵", Description = "Drewniane, ciepłe odcienie", IsDark = false, BodyBackground = "linear-gradient(180deg,#fffaf8,#f6efe9)", Vars = "{\"--bg-primary\":\"#fff9f6\",\"--bg-secondary\":\"#f7efe8\",\"--bg-card\":\"#efe3dc\",\"--text-primary\":\"#2b1c16\",\"--text-secondary\":\"#89614e\",\"--accent\":\"#a0522d\",\"--accent-hover\":\"#c76b43\",\"--border\":\"#e7d0c0\"}", IsActive = true, IsSystem = true, SortOrder = 17, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 18, Name = "Silken Azure", Emoji = "🔵", Description = "Błękitne jedwabie", IsDark = false, BodyBackground = "linear-gradient(180deg,#f6fbff,#eaf6ff)", Vars = "{\"--bg-primary\":\"#f8fdff\",\"--bg-secondary\":\"#eff8ff\",\"--bg-card\":\"#eaf6ff\",\"--text-primary\":\"#12202a\",\"--text-secondary\":\"#4a6b78\",\"--accent\":\"#2196f3\",\"--accent-hover\":\"#42a5f5\",\"--border\":\"#d7eaf8\"}", IsActive = true, IsSystem = true, SortOrder = 18, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 19, Name = "Nocturne", Emoji = "🎼", Description = "Muzyczna atmosfera nocy", IsDark = true, BodyBackground = "linear-gradient(180deg,#040014,#1a0029)", Vars = "{\"--bg-primary\":\"#030012\",\"--bg-secondary\":\"#1a0029\",\"--bg-card\":\"#2b0533\",\"--text-primary\":\"#fffafc\",\"--text-secondary\":\"#d8c7e6\",\"--accent\":\"#c2185b\",\"--accent-hover\":\"#e91e63\",\"--border\":\"#3a0f2a\"}", IsActive = true, IsSystem = true, SortOrder = 19, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 20, Name = "Lavender Haze", Emoji = "💜", Description = "Lawendowa miękkość", IsDark = false, BodyBackground = "linear-gradient(180deg,#fff8ff,#f6f0ff)", Vars = "{\"--bg-primary\":\"#fff9ff\",\"--bg-secondary\":\"#f7f0ff\",\"--bg-card\":\"#f2eaff\",\"--text-primary\":\"#21122b\",\"--text-secondary\":\"#6b4f72\",\"--accent\":\"#9c27b0\",\"--accent-hover\":\"#b66cd9\",\"--border\":\"#ecdff0\"}", IsActive = true, IsSystem = true, SortOrder = 20, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 21, Name = "Seduction", Emoji = "💋", Description = "Intensywna, zmysłowa paleta", IsDark = true, BodyBackground = "linear-gradient(180deg,#12000a,#2b0016)", Vars = "{\"--bg-primary\":\"#0c0305\",\"--bg-secondary\":\"#230412\",\"--bg-card\":\"#341022\",\"--text-primary\":\"#ffeef1\",\"--text-secondary\":\"#f2b8c0\",\"--accent\":\"#e91e63\",\"--accent-hover\":\"#ff6090\",\"--border\":\"#4a1220\"}", IsActive = true, IsSystem = true, SortOrder = 21, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 22, Name = "Coral Veil", Emoji = "🧡", Description = "Korale i delikatność", IsDark = false, BodyBackground = "linear-gradient(180deg,#fff7f5,#ffece8)", Vars = "{\"--bg-primary\":\"#fff8f7\",\"--bg-secondary\":\"#fff0ee\",\"--bg-card\":\"#ffece8\",\"--text-primary\":\"#231617\",\"--text-secondary\":\"#8b5a52\",\"--accent\":\"#ff6f61\",\"--accent-hover\":\"#ff8b77\",\"--border\":\"#f4d7d0\"}", IsActive = true, IsSystem = true, SortOrder = 22, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 23, Name = "Garnet", Emoji = "🔴", Description = "Bogata, klejnotowa czerwień", IsDark = true, BodyBackground = "linear-gradient(180deg,#170006,#3b0610)", Vars = "{\"--bg-primary\":\"#0d0304\",\"--bg-secondary\":\"#2b0506\",\"--bg-card\":\"#3a0c0f\",\"--text-primary\":\"#fff3f3\",\"--text-secondary\":\"#e6bdbd\",\"--accent\":\"#b71c1c\",\"--accent-hover\":\"#e53935\",\"--border\":\"#4a1415\"}", IsActive = true, IsSystem = true, SortOrder = 23, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 24, Name = "Opaline", Emoji = "🟣", Description = "Perłowe, półprzezroczyste odcienie", IsDark = false, BodyBackground = "linear-gradient(180deg,#fbfbff,#f1f0ff)", Vars = "{\"--bg-primary\":\"#ffffff\",\"--bg-secondary\":\"#f8f8ff\",\"--bg-card\":\"#f6f6ff\",\"--text-primary\":\"#1a1620\",\"--text-secondary\":\"#6b6070\",\"--accent\":\"#8e7cc3\",\"--accent-hover\":\"#b39ddb\",\"--border\":\"#e9e6f2\"}", IsActive = true, IsSystem = true, SortOrder = 24, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 25, Name = "Silhouette", Emoji = "🖤", Description = "Minimalistyczna elegancja", IsDark = true, BodyBackground = "linear-gradient(180deg,#010101,#151515)", Vars = "{\"--bg-primary\":\"#050505\",\"--bg-secondary\":\"#0f0f0f\",\"--bg-card\":\"#171717\",\"--text-primary\":\"#f8f8f8\",\"--text-secondary\":\"#9e9e9e\",\"--accent\":\"#607d8b\",\"--accent-hover\":\"#90a4ae\",\"--border\":\"#202020\"}", IsActive = true, IsSystem = true, SortOrder = 25, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 26, Name = "Honeyed", Emoji = "🍯", Description = "Słodkie, ciepłe pastele", IsDark = false, BodyBackground = "linear-gradient(180deg,#fffaf3,#fff1e0)", Vars = "{\"--bg-primary\":\"#fffaf6\",\"--bg-secondary\":\"#fff2ea\",\"--bg-card\":\"#fff0e6\",\"--text-primary\":\"#2c1f18\",\"--text-secondary\":\"#8a6f5f\",\"--accent\":\"#ffb74d\",\"--accent-hover\":\"#ffd27a\",\"--border\":\"#f0d8c0\"}", IsActive = true, IsSystem = true, SortOrder = 26, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 27, Name = "Eclipse", Emoji = "🌑", Description = "Głębokie, kontrastowe tony", IsDark = true, BodyBackground = "linear-gradient(180deg,#00010a,#0b0a1a)", Vars = "{\"--bg-primary\":\"#00020a\",\"--bg-secondary\":\"#0a0914\",\"--bg-card\":\"#12121b\",\"--text-primary\":\"#eef2ff\",\"--text-secondary\":\"#aab0d8\",\"--accent\":\"#536dfe\",\"--accent-hover\":\"#7f93ff\",\"--border\":\"#1a1a2a\"}", IsActive = true, IsSystem = true, SortOrder = 27, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 28, Name = "Amber Night", Emoji = "🌃", Description = "Ciepłe światła nocy", IsDark = true, BodyBackground = "linear-gradient(180deg,#0b0603,#2a1609)", Vars = "{\"--bg-primary\":\"#070403\",\"--bg-secondary\":\"#21100b\",\"--bg-card\":\"#31150d\",\"--text-primary\":\"#fff6eb\",\"--text-secondary\":\"#efd9c1\",\"--accent\":\"#ff8f00\",\"--accent-hover\":\"#ffb300\",\"--border\":\"#3b2416\"}", IsActive = true, IsSystem = true, SortOrder = 28, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 29, Name = "Pearl Veil", Emoji = "🩵", Description = "Subtelne perłowe akcenty", IsDark = false, BodyBackground = "linear-gradient(180deg,#fbfdff,#f2f8ff)", Vars = "{\"--bg-primary\":\"#feffff\",\"--bg-secondary\":\"#f7fbff\",\"--bg-card\":\"#f2f8ff\",\"--text-primary\":\"#11131a\",\"--text-secondary\":\"#6b7280\",\"--accent\":\"#7ab8ff\",\"--accent-hover\":\"#9ad0ff\",\"--border\":\"#e7eef9\"}", IsActive = true, IsSystem = true, SortOrder = 29, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 30, Name = "Scarlet Lace", Emoji = "🩷", Description = "Koronkowa czerwień", IsDark = true, BodyBackground = "linear-gradient(180deg,#150005,#3b0610)", Vars = "{\"--bg-primary\":\"#0b0305\",\"--bg-secondary\":\"#2a0608\",\"--bg-card\":\"#3a0d10\",\"--text-primary\":\"#fff2f3\",\"--text-secondary\":\"#e6b8bd\",\"--accent\":\"#c21807\",\"--accent-hover\":\"#ff4d3f\",\"--border\":\"#471216\"}", IsActive = true, IsSystem = true, SortOrder = 30, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 31, Name = "Velour", Emoji = "🧣", Description = "Miękkie, otulające kolory", IsDark = false, BodyBackground = "linear-gradient(180deg,#fff8fb,#fff1f6)", Vars = "{\"--bg-primary\":\"#fff9fb\",\"--bg-secondary\":\"#fff2f6\",\"--bg-card\":\"#fff0f5\",\"--text-primary\":\"#2b1b22\",\"--text-secondary\":\"#7a5966\",\"--accent\":\"#d81b60\",\"--accent-hover\":\"#ff5c93\",\"--border\":\"#f4dce6\"}", IsActive = true, IsSystem = true, SortOrder = 31, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 32, Name = "Silk Rose", Emoji = "🌷", Description = "Delikatne płatki", IsDark = false, BodyBackground = "linear-gradient(180deg,#fff6f7,#fff0f2)", Vars = "{\"--bg-primary\":\"#fff8f8\",\"--bg-secondary\":\"#fff1f2\",\"--bg-card\":\"#fff0f1\",\"--text-primary\":\"#22111a\",\"--text-secondary\":\"#7a4f5c\",\"--accent\":\"#ff3366\",\"--accent-hover\":\"#ff6b99\",\"--border\":\"#f3d7df\"}", IsActive = true, IsSystem = true, SortOrder = 32, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) },
                new SkinTheme { Id = 33, Name = "Twilight Silk", Emoji = "🌌", Description = "Nocne jedwabiste odcienie", IsDark = true, BodyBackground = "linear-gradient(180deg,#0a0612,#241229)", Vars = "{\"--bg-primary\":\"#060412\",\"--bg-secondary\":\"#1b0f21\",\"--bg-card\":\"#2b1627\",\"--text-primary\":\"#faf6ff\",\"--text-secondary\":\"#d9c8e6\",\"--accent\":\"#7c4dff\",\"--accent-hover\":\"#a58bff\",\"--border\":\"#3a213a\"}", IsActive = true, IsSystem = true, SortOrder = 33, CreatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc) }
            );
        }
    }
}
