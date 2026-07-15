using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;
using FinCore.Domain.Entities;
using FinCore.Domain.Common;

namespace FinCore.Application.Features.Transactions.Commands.AdjustFund;

public record AdjustFundCommand(
    decimal Balance,
    decimal TotalRevenue,
    decimal TotalExpense
) : IRequest<bool>;

public class AdjustFundCommandHandler : IRequestHandler<AdjustFundCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AdjustFundCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(AdjustFundCommand request, CancellationToken cancellationToken)
    {
        var fund = await _context.ClubFunds.FirstOrDefaultAsync(cancellationToken);
        if (fund == null)
        {
            fund = new ClubFund();
            _context.ClubFunds.Add(fund);
        }

        fund.Balance = request.Balance;
        fund.TotalRevenue = request.TotalRevenue;
        fund.TotalExpense = request.TotalExpense;
        fund.LastUpdatedAt = TimeHelper.GetVietnamTime();

        var userIdStr = _currentUserService.UserId;
        if (!string.IsNullOrEmpty(userIdStr) && Guid.TryParse(userIdStr, out var userId))
        {
            var log = new ActivityLog
            {
                UserId = userId,
                Action = "Cấu hình số dư quỹ",
                EntityName = "ClubFund",
                EntityId = fund.Id,
                Description = $"Điều chỉnh quỹ thủ công. Số dư mới: {request.Balance:N0}đ, Tổng doanh thu tích lũy: {request.TotalRevenue:N0}đ, Tổng chi tiêu tích lũy: {request.TotalExpense:N0}đ.",
                Timestamp = TimeHelper.GetVietnamTime()
            };
            _context.ActivityLogs.Add(log);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
