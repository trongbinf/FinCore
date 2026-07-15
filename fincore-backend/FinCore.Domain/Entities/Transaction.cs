using System;
using FinCore.Domain.Common;
using FinCore.Domain.Enums;

namespace FinCore.Domain.Entities;

public class Transaction : BaseEntity
{
    public string Title { get; set; } = null!;
    public TransactionType Type { get; set; }
    public Guid CategoryId { get; set; }
    public virtual TransactionCategory Category { get; set; } = null!;
    public decimal Amount { get; set; }
    public DateTime TransactionDate { get; set; }
    public string? Description { get; set; }
    public Guid CreatorId { get; set; }
    public virtual User Creator { get; set; } = null!;
    
    // Approval status details
    public TransactionStatus Status { get; set; } = TransactionStatus.Pending;
    public Guid? ApprovedById { get; set; }
    public virtual User? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
}
