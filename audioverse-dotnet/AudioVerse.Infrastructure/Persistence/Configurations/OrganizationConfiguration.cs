using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for Organization.</summary>
public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Name).HasMaxLength(300);
        b.HasMany(e => e.Leagues).WithOne(l => l.Organization).HasForeignKey(l => l.OrganizationId).OnDelete(DeleteBehavior.SetNull);
    }
}
