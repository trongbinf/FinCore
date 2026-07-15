using System;
using Microsoft.AspNetCore.Identity;
using FinCore.Domain.Enums;

namespace FinCore.Domain.Entities;

public class User : IdentityUser<Guid>
{
    public string FullName { get; set; } = null!;
    public string? Phone { get; set; }
    public UserRole Role { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsPasswordTemp { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }

    // Audit fields manually added since we cannot inherit from BaseEntity
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    public string? LastModifiedBy { get; set; }
}
