using System;
using System.Threading;
using System.Threading.Tasks;
using FinCore.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FinCore.Application.Features.Auth.Commands.ChangePassword;

public record ChangePasswordCommand(Guid UserId, string OldPassword, string NewPassword)
    : IRequest<bool>;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher
    )
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<bool> Handle(
        ChangePasswordCommand request,
        CancellationToken cancellationToken
    )
    {
        var user = await _context.Users.FirstOrDefaultAsync(
            u => u.Id == request.UserId && u.IsActive,
            cancellationToken
        );

        if (user == null)
        {
            throw new Exception("Người dùng không tồn tại hoặc đã bị khóa.");
        }

        var isOldPasswordValid = _passwordHasher.VerifyPassword(
            request.OldPassword,
            user.PasswordHash
        );
        if (!isOldPasswordValid)
        {
            throw new Exception("Mật khẩu cũ không chính xác.");
        }

        // Update password
        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.IsPasswordTemp = false; // Mật khẩu tạm thời được gỡ bỏ

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
