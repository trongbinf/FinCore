using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;
using FinCore.Domain.Entities;
using FinCore.Domain.Enums;

namespace FinCore.Application.Features.Users.Commands.UpdateUser;

public record UpdateUserCommand(
    Guid Id,
    string FullName,
    string? Phone,
    UserRole Role
) : IRequest<bool>;

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateUserCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (user == null)
        {
            throw new Exception("Tài khoản không tồn tại.");
        }

        // Track changes
        var changes = new System.Collections.Generic.List<string>();
        if (user.FullName != request.FullName) changes.Add($"họ tên: '{user.FullName}' -> '{request.FullName}'");
        if (user.Phone != request.Phone) changes.Add($"SĐT: '{user.Phone}' -> '{request.Phone}'");
        if (user.Role != request.Role) changes.Add($"vai trò: '{user.Role}' -> '{request.Role}'");
        var changesStr = changes.Count > 0 ? string.Join(", ", changes) : "không thay đổi thông tin chính";

        user.FullName = request.FullName;
        user.Phone = request.Phone;
        user.Role = request.Role;

        var userIdStr = _currentUserService.UserId;
        Guid.TryParse(userIdStr, out var userId);

        var log = new ActivityLog
        {
            UserId = userId,
            Action = "Cập nhật thành viên",
            EntityName = "User",
            EntityId = user.Id,
            Description = $"Cập nhật thông tin thành viên '{user.Email}'. Chi tiết thay đổi: {changesStr}.",
            Timestamp = FinCore.Domain.Common.TimeHelper.GetVietnamTime()
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
