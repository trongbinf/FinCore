using System;
using System.Threading;
using System.Threading.Tasks;
using FinCore.Application.Interfaces;
using FinCore.Domain.Entities;
using FinCore.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FinCore.Application.Features.Transactions.Commands.UpdateTransactionCategory;

public record UpdateTransactionCategoryCommand(Guid Id, string Name, TransactionType Type)
    : IRequest<bool>;

public class UpdateTransactionCategoryCommandHandler
    : IRequestHandler<UpdateTransactionCategoryCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateTransactionCategoryCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService
    )
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(
        UpdateTransactionCategoryCommand request,
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

        var oldName = category.Name;
        var oldType = category.Type;

        category.Name = request.Name.Trim();
        category.Type = request.Type;

        var userId = GetCurrentUserId();
        var log = new ActivityLog
        {
            UserId = userId,
            Action = "Cập nhật danh mục giao dịch",
            EntityName = "TransactionCategory",
            EntityId = category.Id,
            Description =
                $"Cập nhật danh mục giao dịch '{oldName}' ({oldType}) thành '{category.Name}' ({category.Type}).",
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
