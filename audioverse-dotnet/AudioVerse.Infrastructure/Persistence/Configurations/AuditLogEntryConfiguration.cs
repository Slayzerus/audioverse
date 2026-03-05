using AudioVerse.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for EntityChangeLog.</summary>
public class EntityChangeLogConfiguration : IEntityTypeConfiguration<EntityChangeLog>
{
    public void Configure(EntityTypeBuilder<EntityChangeLog> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.EntityName).HasMaxLength(200);
        b.Property(e => e.EntityId).HasMaxLength(100);
        b.Property(e => e.Action).HasMaxLength(20);
        b.HasIndex(e => new { e.EntityName, e.EntityId }).HasDatabaseName("IDX_Audit_Entity");
        b.HasIndex(e => e.Timestamp).HasDatabaseName("IDX_Audit_Timestamp");
    }
}
