using Microsoft.EntityFrameworkCore;
using FinCore.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace FinCore.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<TransactionCategory> TransactionCategories { get; }
    DbSet<Transaction> Transactions { get; }
    DbSet<ClubFund> ClubFunds { get; }
    DbSet<ActivityLog> ActivityLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
