using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;
using FinCore.Domain.Entities;
using FinCore.Domain.Enums;
using FinCore.Domain.Common;

namespace FinCore.API.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/system")]
public class SystemController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public SystemController(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpPost("reset-data")]
    public async Task<ActionResult<bool>> ResetData()
    {
        try
        {
            var userIdStr = _currentUserService.UserId;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính Admin." });
            }

            // 1. Delete all transactions
            _context.Transactions.RemoveRange(_context.Transactions);

            // 2. Delete all activity logs
            _context.ActivityLogs.RemoveRange(_context.ActivityLogs);

            // 3. Delete all users except the current admin
            var otherUsers = _context.Users.Where(u => u.Id != currentUserId);
            _context.Users.RemoveRange(otherUsers);

            // 4. Reset Club Fund to 0
            _context.ClubFunds.RemoveRange(_context.ClubFunds);
            
            var newFund = new ClubFund
            {
                TotalRevenue = 0,
                TotalExpense = 0,
                Balance = 0,
                LastUpdatedAt = TimeHelper.GetVietnamTime()
            };
            _context.ClubFunds.Add(newFund);

            // 5. Keep standard categories but delete custom ones if any, or just keep all categories
            // Let's just keep all existing categories so they don't have to re-create them. 
            // If they want to reset categories, we can delete them and seed default ones, but keeping categories is usually preferred since it's configuration, not transactional data.
            // Let's delete all transactions first to prevent foreign key issues, then we can keep categories.

            await _context.SaveChangesAsync();

            // Create a system log for database reset
            var resetLog = new ActivityLog
            {
                UserId = currentUserId,
                Action = "Reset hệ thống",
                EntityName = "System",
                Description = "Đã thực hiện reset toàn bộ dữ liệu dự án (xóa tất cả giao dịch, nhật ký hoạt động, tài khoản thành viên khác và đưa số dư quỹ về 0đ).",
                Timestamp = TimeHelper.GetVietnamTime()
            };
            _context.ActivityLogs.Add(resetLog);
            await _context.SaveChangesAsync();

            return Ok(true);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Reset dữ liệu thất bại: {ex.Message}" });
        }
    }
}
