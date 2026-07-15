using System;
using System.Threading;
using System.Threading.Tasks;
using FinCore.Application.Interfaces;
using FinCore.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FinCore.Application.Features.Transactions.Commands.DeleteTransactionCategory;

public record DeleteTransactionCategoryCommand(Guid Id) : IRequest<bool>;

public class DeleteTransactionCategoryCommandHandler
    : IRequestHandler<DeleteTransactionCategoryCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteTransactionCategoryCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService
    )
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(
        DeleteTransactionCategoryCommand request,
        CancellationToken cancellationToken
    )
    {
        var category = await _context.TransactionCategories.FirstOrDefaultAsync(
            c => c.Id == request.Id && c.IsActive,
            cancellationToken
        );

        if (category == null)
        {
            throw new Exception("Danh mục giao dịch không tồn tại.");
        }

        category.IsActive = false;

        var userId = GetCurrentUserId();
        var log = new ActivityLog
        {
            UserId = userId,
            Action = "Xóa danh mục giao dịch",
            EntityName = "TransactionCategory",
            EntityId = category.Id,
            Description = $"Vô hiệu hoá danh mục giao dịch '{category.Name}' ({category.Type}).",
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync(cancellationToken);
        return true;
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
