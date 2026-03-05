using AudioVerse.Domain.Entities.UserProfiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Text.Json;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class UserProfilePlayerConfiguration : IEntityTypeConfiguration<UserProfilePlayer>
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        public void Configure(EntityTypeBuilder<UserProfilePlayer> builder)
        {
            builder.Property(p => p.KaraokeSettings)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonOptions),
                    v => JsonSerializer.Deserialize<KaraokeSettings>(v, JsonOptions) ?? new KaraokeSettings())
                .HasColumnType("text")
                .Metadata.SetValueComparer(new ValueComparer<KaraokeSettings>(
                    (a, b) => JsonSerializer.Serialize(a, JsonOptions) == JsonSerializer.Serialize(b, JsonOptions),
                    v => JsonSerializer.Serialize(v, JsonOptions).GetHashCode(),
                    v => JsonSerializer.Deserialize<KaraokeSettings>(JsonSerializer.Serialize(v, JsonOptions), JsonOptions)!));
        }
    }
}
