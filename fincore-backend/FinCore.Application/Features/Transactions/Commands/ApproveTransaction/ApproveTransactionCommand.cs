using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;
using FinCore.Domain.Entities;
using FinCore.Domain.Enums;
using FinCore.Domain.Common;

namespace FinCore.Application.Features.Transactions.Commands.ApproveTransaction;

public record ApproveTransactionCommand(
    Guid TransactionId,
    TransactionStatus Status,
    string? RejectionReason
) : IRequest<bool>;

public class ApproveTransactionCommandHandler : IRequestHandler<ApproveTransactionCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ApproveTransactionCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(ApproveTransactionCommand request, CancellationToken cancellationToken)
    {
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == request.TransactionId, cancellationToken);

        if (transaction == null)
        {
            throw new Exception("Giao dịch không tồn tại.");
        }

        if (transaction.Status != TransactionStatus.Pending)
        {
            throw new Exception("Chỉ giao dịch ở trạng thái chờ duyệt mới có thể phê duyệt/từ chối.");
        }

        var approverIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(approverIdStr) || !Guid.TryParse(approverIdStr, out var approverId))
        {
            throw new Exception("Không xác định được người thực hiện phê duyệt.");
        }

        // Set approval details
        transaction.Status = request.Status;
        transaction.ApprovedById = approverId;
        transaction.ApprovedAt = TimeHelper.GetVietnamTime();

        if (request.Status == TransactionStatus.Rejected)
        {
            transaction.RejectionReason = request.RejectionReason;
        }
        else if (request.Status == TransactionStatus.Approved)
        {
            // Update Club Fund
            var fund = await _context.ClubFunds.FirstOrDefaultAsync(cancellationToken);
            if (fund == null)
            {
                fund = new ClubFund
                {
                    TotalRevenue = 0,
                    TotalExpense = 0,
                    Balance = 0,
                    LastUpdatedAt = TimeHelper.GetVietnamTime()
                };
                _context.ClubFunds.Add(fund);
            }

            if (transaction.Type == TransactionType.Revenue)
            {
                fund.TotalRevenue += transaction.Amount;
            }
            else if (transaction.Type == TransactionType.Expense)
            {
                fund.TotalExpense += transaction.Amount;
            }

            fund.Balance = fund.TotalRevenue - fund.TotalExpense;
            fund.LastUpdatedAt = TimeHelper.GetVietnamTime();
        }

        // Log activity
        var activityLog = new ActivityLog
        {
            UserId = approverId,
            Action = request.Status == TransactionStatus.Approved ? "Duyệt giao dịch" : "Từ chối giao dịch",
            EntityName = "Transaction",
            EntityId = transaction.Id,
            Description = request.Status == TransactionStatus.Approved 
                ? $"Phê duyệt khoản {(transaction.Type == TransactionType.Revenue ? "thu" : "chi")} '{transaction.Title}', số tiền: {transaction.Amount:N0}đ."
                : $"Từ chối khoản {(transaction.Type == TransactionType.Revenue ? "thu" : "chi")} '{transaction.Title}', số tiền: {transaction.Amount:N0}đ. Lý do: '{request.RejectionReason}'.",
            Timestamp = TimeHelper.GetVietnamTime()
        };
        _context.ActivityLogs.Add(activityLog);

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
