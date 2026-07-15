using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FinCore.Domain.Entities;

namespace FinCore.Infrastructure.Persistence.Configurations;

public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> builder)
    {
        builder.HasKey(al => al.Id);

        builder.Property(al => al.Action)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(al => al.EntityName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(al => al.EntityId)
            .IsRequired();

        builder.Property(al => al.Timestamp)
            .IsRequired();

        builder.Property(al => al.Description)
            .HasMaxLength(1000);

        builder.Property(al => al.IpAddress)
            .HasMaxLength(50);

        builder.HasOne(al => al.User)
            .WithMany()
            .HasForeignKey(al => al.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
