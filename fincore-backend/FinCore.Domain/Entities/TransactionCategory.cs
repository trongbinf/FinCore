using System.Collections.Generic;
using FinCore.Domain.Common;
using FinCore.Domain.Enums;

namespace FinCore.Domain.Entities;

public class TransactionCategory : BaseEntity
{
    public string Name { get; set; } = null!;
    public TransactionType Type { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation property
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
