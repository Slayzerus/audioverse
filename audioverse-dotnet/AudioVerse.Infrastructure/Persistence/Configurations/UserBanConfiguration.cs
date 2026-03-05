using AudioVerse.Domain.Entities.Admin;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class UserBanConfiguration : IEntityTypeConfiguration<UserBan>
    {
        public void Configure(EntityTypeBuilder<UserBan> builder)
        {
            builder.HasKey(e => e.Id);
            builder.HasIndex(e => new { e.UserId, e.IsActive }).HasDatabaseName("IDX_UserBan_User_Active");
        }
    }
}
