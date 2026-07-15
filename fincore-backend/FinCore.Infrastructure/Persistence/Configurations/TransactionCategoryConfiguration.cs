using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FinCore.Domain.Entities;

namespace FinCore.Infrastructure.Persistence.Configurations;

public class TransactionCategoryConfiguration : IEntityTypeConfiguration<TransactionCategory>
{
    public void Configure(EntityTypeBuilder<TransactionCategory> builder)
    {
        builder.HasKey(tc => tc.Id);

        builder.Property(tc => tc.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(tc => tc.Type)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(tc => tc.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(tc => tc.CreatedBy)
            .HasMaxLength(100);

        builder.Property(tc => tc.LastModifiedBy)
            .HasMaxLength(100);
    }
}
