using AudioVerse.Domain.Entities.Contacts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class ContactEmailConfiguration : IEntityTypeConfiguration<ContactEmail>
    {
        public void Configure(EntityTypeBuilder<ContactEmail> builder)
        {
            builder.Property(e => e.Type).HasConversion<int>();
        }
    }
}
