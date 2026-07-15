using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;
using FinCore.Domain.Entities;

namespace FinCore.Application.Features.Users.Commands.ToggleUserLock;

public record ToggleUserLockCommand(Guid Id, bool IsActive) : IRequest<bool>;

public class ToggleUserLockCommandHandler : IRequestHandler<ToggleUserLockCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ToggleUserLockCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(ToggleUserLockCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (user == null)
        {
            throw new Exception("Tài khoản không tồn tại.");
        }

        user.IsActive = request.IsActive;

        var userIdStr = _currentUserService.UserId;
        Guid.TryParse(userIdStr, out var userId);

        var log = new ActivityLog
        {
            UserId = userId,
            Action = request.IsActive ? "Mở khóa tài khoản" : "Khóa tài khoản",
            EntityName = "User",
            EntityId = user.Id,
            Description = request.IsActive 
                ? $"Mở khóa tài khoản của thành viên '{user.Email}' ({user.FullName})."
                : $"Khóa tài khoản của thành viên '{user.Email}' ({user.FullName}).",
            Timestamp = FinCore.Domain.Common.TimeHelper.GetVietnamTime()
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
