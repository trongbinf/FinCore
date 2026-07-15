using System;
using System.Threading;
using System.Threading.Tasks;
using FinCore.Application.Interfaces;
using FinCore.Domain.Entities;
using FinCore.Domain.Enums;
using MediatR;

namespace FinCore.Application.Features.Transactions.Commands.CreateTransactionCategory;

public record CreateTransactionCategoryCommand(string Name, TransactionType Type) : IRequest<Guid>;

public class CreateTransactionCategoryCommandHandler
    : IRequestHandler<CreateTransactionCategoryCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateTransactionCategoryCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService
    )
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Guid> Handle(
        CreateTransactionCategoryCommand request,
        CancellationToken cancellationToken
    )
    {
        var category = new TransactionCategory
        {
            Name = request.Name.Trim(),
            Type = request.Type,
            IsActive = true,
        };

        _context.TransactionCategories.Add(category);

        var userId = GetCurrentUserId();
        var log = new ActivityLog
        {
            UserId = userId,
            Action = "Thêm danh mục giao dịch",
            EntityName = "TransactionCategory",
            EntityId = category.Id,
            Description = $"Thêm danh mục giao dịch '{request.Name}' ({request.Type}).",
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync(cancellationToken);
        return category.Id;
    }

    private Guid GetCurrentUserId()
    {
        var userIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
        {
            throw new Exception("Không xác định được người dùng hiện tại.");
        }
        return userId;
    }
}
