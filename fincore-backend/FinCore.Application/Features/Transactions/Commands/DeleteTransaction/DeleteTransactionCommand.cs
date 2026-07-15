using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;
using FinCore.Domain.Entities;
using FinCore.Domain.Enums;

namespace FinCore.Application.Features.Transactions.Commands.DeleteTransaction;

public record DeleteTransactionCommand(Guid Id) : IRequest<bool>;

public class DeleteTransactionCommandHandler : IRequestHandler<DeleteTransactionCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteTransactionCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DeleteTransactionCommand request, CancellationToken cancellationToken)
    {
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

        if (transaction == null)
        {
            throw new Exception("Giao dịch không tồn tại.");
        }

        if (transaction.Status != TransactionStatus.Pending)
        {
            throw new Exception("Chỉ giao dịch ở trạng thái chờ duyệt mới có thể xóa.");
        }

        var userIdStr = _currentUserService.UserId;
        Guid.TryParse(userIdStr, out var userId);

        var log = new ActivityLog
        {
            UserId = userId,
            Action = "Xóa giao dịch",
            EntityName = "Transaction",
            EntityId = transaction.Id,
            Description = $"Xóa giao dịch chờ duyệt '{transaction.Title}' của người tạo (ID: {transaction.CreatorId}), Số tiền: {transaction.Amount:N0}đ."
        };

        _context.Transactions.Remove(transaction);
        _context.ActivityLogs.Add(log);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
