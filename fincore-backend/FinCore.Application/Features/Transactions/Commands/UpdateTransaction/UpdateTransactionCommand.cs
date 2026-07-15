using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;
using FinCore.Domain.Entities;
using FinCore.Domain.Enums;
using FinCore.Domain.Common;

namespace FinCore.Application.Features.Transactions.Commands.UpdateTransaction;

public record UpdateTransactionCommand(
    Guid Id,
    string Title,
    Guid CategoryId,
    decimal Amount,
    DateTime TransactionDate,
    string? Description
) : IRequest<bool>;

public class UpdateTransactionCommandHandler : IRequestHandler<UpdateTransactionCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateTransactionCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(UpdateTransactionCommand request, CancellationToken cancellationToken)
    {
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

        if (transaction == null)
        {
            throw new Exception("Giao dịch không tồn tại.");
        }

        if (transaction.Status != TransactionStatus.Pending)
        {
            throw new Exception("Chỉ giao dịch ở trạng thái chờ duyệt mới được phép chỉnh sửa.");
        }

        var category = await _context.TransactionCategories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.IsActive, cancellationToken);

        if (category == null)
        {
            throw new Exception("Danh mục giao dịch không tồn tại hoặc đã bị khóa.");
        }

        // Track changes
        var changes = new System.Collections.Generic.List<string>();
        if (transaction.Title != request.Title) changes.Add($"tiêu đề: '{transaction.Title}' -> '{request.Title}'");
        if (transaction.CategoryId != request.CategoryId) changes.Add($"danh mục: (ID) -> '{request.CategoryId}'");
        if (transaction.Amount != request.Amount) changes.Add($"số tiền: {transaction.Amount:N0}đ -> {request.Amount:N0}đ");
        if (transaction.TransactionDate != request.TransactionDate) changes.Add($"ngày: {transaction.TransactionDate:yyyy-MM-dd} -> {request.TransactionDate:yyyy-MM-dd}");

        var changesStr = changes.Count > 0 ? string.Join(", ", changes) : "không thay đổi giá trị chính";

        transaction.Title = request.Title;
        transaction.CategoryId = request.CategoryId;
        transaction.Amount = request.Amount;
        transaction.TransactionDate = request.TransactionDate;
        transaction.Description = request.Description;

        var userIdStr = _currentUserService.UserId;
        Guid.TryParse(userIdStr, out var userId);

        var log = new ActivityLog
        {
            UserId = userId,
            Action = "Cập nhật giao dịch",
            EntityName = "Transaction",
            EntityId = transaction.Id,
            Description = $"Chỉnh sửa giao dịch chờ duyệt. Chi tiết thay đổi: {changesStr}."
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
