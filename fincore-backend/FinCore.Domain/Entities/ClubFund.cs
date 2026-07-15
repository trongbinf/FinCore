using System;

namespace FinCore.Domain.Entities;

public class ClubFund
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public decimal TotalRevenue { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal Balance { get; set; } // Balance = TotalRevenue - TotalExpense
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
}
