using AudioVerse.Domain.Entities.Contacts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class ContactPhoneConfiguration : IEntityTypeConfiguration<ContactPhone>
    {
        public void Configure(EntityTypeBuilder<ContactPhone> builder)
        {
            builder.Property(p => p.Type).HasConversion<int>();
        }
    }
}
