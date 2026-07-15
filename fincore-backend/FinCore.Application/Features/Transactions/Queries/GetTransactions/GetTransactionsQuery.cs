using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;
using FinCore.Domain.Enums;

namespace FinCore.Application.Features.Transactions.Queries.GetTransactions;

public record GetTransactionsQuery : IRequest<List<TransactionDto>>;

public class TransactionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string Type { get; set; } = null!;
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public decimal Amount { get; set; }
    public DateTime TransactionDate { get; set; }
    public string? Description { get; set; }
    public string CreatorName { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
}

public class GetTransactionsQueryHandler : IRequestHandler<GetTransactionsQuery, List<TransactionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetTransactionsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<TransactionDto>> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
    {
        var currentUserIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(currentUserIdStr) || !Guid.TryParse(currentUserIdStr, out var currentUserId))
        {
            throw new Exception("Không xác định được người dùng hiện tại.");
        }

        var currentUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId, cancellationToken);

        if (currentUser == null)
        {
            throw new Exception("Người dùng không hợp lệ.");
        }

        var query = _context.Transactions
            .Include(t => t.Category)
            .Include(t => t.Creator)
            .Include(t => t.ApprovedBy)
            .AsQueryable();

        // Security Filter: Members can only see Approved transactions. Admins see all.
        if (currentUser.Role == UserRole.Member)
        {
            query = query.Where(t => t.Status == TransactionStatus.Approved);
        }

        var transactions = await query
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new TransactionDto
            {
                Id = t.Id,
                Title = t.Title,
                Type = t.Type.ToString(),
                CategoryId = t.CategoryId,
                CategoryName = t.Category.Name,
                Amount = t.Amount,
                TransactionDate = t.TransactionDate,
                Description = t.Description,
                CreatorName = t.Creator.FullName,
                Status = t.Status.ToString(),
                ApprovedByName = t.ApprovedBy != null ? t.ApprovedBy.FullName : null,
                ApprovedAt = t.ApprovedAt,
                RejectionReason = t.RejectionReason
            })
            .ToListAsync(cancellationToken);

        return transactions;
    }
}
