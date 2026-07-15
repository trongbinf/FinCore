using System;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using FinCore.Domain.Common;
using FinCore.Domain.Entities;
using FinCore.Application.Interfaces;

namespace FinCore.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>, IApplicationDbContext
{
    private readonly ICurrentUserService _currentUserService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService) : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<TransactionCategory> TransactionCategories { get; set; } = null!;
    public DbSet<Transaction> Transactions { get; set; } = null!;
    public DbSet<ClubFund> ClubFunds { get; set; } = null!;
    public DbSet<ActivityLog> ActivityLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is BaseEntity baseEntity)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        baseEntity.CreatedAt = TimeHelper.GetVietnamTime();
                        baseEntity.CreatedBy = _currentUserService.UserId ?? "System";
                        break;

                    case EntityState.Modified:
                        baseEntity.LastModifiedAt = TimeHelper.GetVietnamTime();
                        baseEntity.LastModifiedBy = _currentUserService.UserId ?? "System";
                        break;
                }
            }
            else if (entry.Entity is User userEntity)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        userEntity.CreatedAt = TimeHelper.GetVietnamTime();
                        userEntity.CreatedBy = _currentUserService.UserId ?? "System";
                        break;

                    case EntityState.Modified:
                        userEntity.LastModifiedAt = TimeHelper.GetVietnamTime();
                        userEntity.LastModifiedBy = _currentUserService.UserId ?? "System";
                        break;
                }
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
