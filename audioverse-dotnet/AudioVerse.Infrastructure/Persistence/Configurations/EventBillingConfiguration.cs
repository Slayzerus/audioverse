using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventExpenseConfiguration : IEntityTypeConfiguration<EventExpense>
{
    public void Configure(EntityTypeBuilder<EventExpense> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Category).HasConversion<int>();
        builder.Property(e => e.SplitMethod).HasConversion<int>();
        builder.Property(e => e.Amount).HasPrecision(18, 2);
        builder.HasIndex(e => e.EventId).HasDatabaseName("IDX_Expense_Event");
        builder.HasMany(e => e.Shares).WithOne(s => s.Expense).HasForeignKey(s => s.ExpenseId).OnDelete(DeleteBehavior.Cascade);
    }
}
