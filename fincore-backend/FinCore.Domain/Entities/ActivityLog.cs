using System;
using FinCore.Domain.Entities;

namespace FinCore.Domain.Entities;

public class ActivityLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;
    public string Action { get; set; } = null!; // "Duyệt giao dịch", "Cấp tài khoản mới", etc.
    public string EntityName { get; set; } = null!; // "Transaction", "User", etc.
    public Guid EntityId { get; set; }
    public string? Description { get; set; } // Detailed action description
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
}
