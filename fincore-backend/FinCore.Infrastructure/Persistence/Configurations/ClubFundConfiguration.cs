using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FinCore.Domain.Entities;

namespace FinCore.Infrastructure.Persistence.Configurations;

public class ClubFundConfiguration : IEntityTypeConfiguration<ClubFund>
{
    public void Configure(EntityTypeBuilder<ClubFund> builder)
    {
        builder.HasKey(cf => cf.Id);

        builder.Property(cf => cf.TotalRevenue)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(cf => cf.TotalExpense)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(cf => cf.Balance)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(cf => cf.LastUpdatedAt)
            .IsRequired();
    }
}
