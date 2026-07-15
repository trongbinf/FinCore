using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;
using FinCore.Domain.Entities;
using FinCore.Domain.Enums;

namespace FinCore.Application.Features.Transactions.Commands.CreateTransaction;

public record CreateTransactionCommand(
    string Title,
    TransactionType Type,
    Guid CategoryId,
    decimal Amount,
    DateTime TransactionDate,
    string? Description
) : IRequest<Guid>;

public class CreateTransactionCommandHandler : IRequestHandler<CreateTransactionCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateTransactionCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Guid> Handle(CreateTransactionCommand request, CancellationToken cancellationToken)
    {
        var category = await _context.TransactionCategories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.IsActive, cancellationToken);

        if (category == null)
        {
            throw new Exception("Danh mục giao dịch không tồn tại hoặc đã bị khóa.");
        }

        var creatorIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(creatorIdStr) || !Guid.TryParse(creatorIdStr, out var creatorId))
        {
            throw new Exception("Không xác định được người tạo giao dịch.");
        }

        var transaction = new Transaction
        {
            Title = request.Title,
            Type = request.Type,
            CategoryId = request.CategoryId,
            Amount = request.Amount,
            TransactionDate = request.TransactionDate,
            Description = request.Description,
            CreatorId = creatorId,
            Status = TransactionStatus.Pending
        };

        _context.Transactions.Add(transaction);

        // Add Activity Log
        var log = new ActivityLog
        {
            UserId = creatorId,
            Action = "Tạo đề xuất giao dịch",
            EntityName = "Transaction",
            EntityId = transaction.Id,
            Description = $"Đề xuất khoản {(request.Type == TransactionType.Revenue ? "thu" : "chi")} '{request.Title}', Danh mục: '{category.Name}', Số tiền: {request.Amount:N0}đ, Ngày: {request.TransactionDate:yyyy-MM-dd}."
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync(cancellationToken);

        return transaction.Id;
    }
}
