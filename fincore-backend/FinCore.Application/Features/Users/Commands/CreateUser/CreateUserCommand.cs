using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;
using FinCore.Domain.Entities;
using FinCore.Domain.Enums;

namespace FinCore.Application.Features.Users.Commands.CreateUser;

public record CreateUserCommand(
    string FullName,
    string Email,
    string? Phone,
    UserRole Role
) : IRequest<CreateUserResponse>;

public record CreateUserResponse(
    Guid UserId,
    string Email
);

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, CreateUserResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUserService;
    private readonly IEmailService _emailService;

    public CreateUserCommandHandler(
        IApplicationDbContext context, 
        IPasswordHasher passwordHasher, 
        ICurrentUserService currentUserService,
        IEmailService emailService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _currentUserService = currentUserService;
        _emailService = emailService;
    }

    public async Task<CreateUserResponse> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var existingUser = await _context.Users
            .AnyAsync(u => u.Email == request.Email, cancellationToken);

        if (existingUser)
        {
            throw new Exception("Email đã được sử dụng bởi một tài khoản khác.");
        }

        // Generate temporary password
        var temporaryPassword = GenerateTemporaryPassword();
        var passwordHash = _passwordHasher.HashPassword(temporaryPassword);

        var newUser = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            Role = request.Role,
            PasswordHash = passwordHash,
            IsActive = true,
            IsPasswordTemp = true
        };

        _context.Users.Add(newUser);

        var userIdStr = _currentUserService.UserId;
        Guid.TryParse(userIdStr, out var userId);

        var log = new ActivityLog
        {
            UserId = userId,
            Action = "Cấp tài khoản mới",
            EntityName = "User",
            EntityId = newUser.Id,
            Description = $"Cấp tài khoản mới cho {newUser.FullName} (Email: {newUser.Email}, Vai trò: {newUser.Role}).",
            Timestamp = FinCore.Domain.Common.TimeHelper.GetVietnamTime()
        };
        _context.ActivityLogs.Add(log);

        // 1. Send email notification first (if this throws, the user won't be saved in the database)
        try
        {
            var subject = "Chào mừng bạn đến với FinCore - Thông tin tài khoản mới";
            var body = $@"
                <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);'>
                    <h2 style='color: #059669; margin-top: 0;'>Chào mừng bạn đến với FinCore!</h2>
                    <p>Tài khoản quản lý tài chính của bạn đã được khởi tạo thành công bởi Ban quản trị.</p>
                    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;' />
                    <p><strong>Thông tin đăng nhập của bạn:</strong></p>
                    <table style='width: 100%; border-collapse: collapse; margin-bottom: 16px;'>
                        <tr>
                            <td style='padding: 8px 0; color: #6b7280; width: 120px;'>Họ và tên:</td>
                            <td style='padding: 8px 0; font-weight: bold;'>{newUser.FullName}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; color: #6b7280;'>Email:</td>
                            <td style='padding: 8px 0; font-weight: bold;'>{newUser.Email}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; color: #6b7280;'>Mật khẩu tạm:</td>
                            <td style='padding: 8px 0; font-weight: bold; color: #dc2626;'>{temporaryPassword}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; color: #6b7280;'>Vai trò:</td>
                            <td style='padding: 8px 0;'><span style='background-color: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 0.85em;'>{newUser.Role}</span></td>
                        </tr>
                    </table>
                    <div style='background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; margin-bottom: 16px;'>
                        <p style='margin: 0; color: #b45309; font-size: 0.9em;'>
                            <strong>Lưu ý:</strong> Mật khẩu trên là mật khẩu tạm thời. Hệ thống sẽ yêu cầu bạn đổi mật khẩu mới trong lần đăng nhập đầu tiên để bảo mật tài khoản.
                        </p>
                    </div>
                    <p style='margin-bottom: 0; font-size: 0.9em; color: #9ca3af;'>Trân trọng,<br/>Đội ngũ FinCore Support</p>
                </div>";

            try
            {
                await _emailService.SendEmailAsync(newUser.Email, subject, body);
            }
            catch (Exception ex)
            {
                // Log warning but allow user creation to succeed
                Console.WriteLine($"[Warning] Failed to send activation email to {newUser.Email}: {ex.Message}");
            }
        }
        catch (Exception ex)
        {
            // This catches any other exceptions (like token generation or DB prep), not the email sending
            throw new Exception($"Lỗi chuẩn bị thông tin tài khoản: {ex.Message}");
        }

        // 2. Save to DB regardless of email sending success
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateUserResponse(
            newUser.Id,
            newUser.Email
        );
    }

    private string GenerateTemporaryPassword()
    {
        var guidPart = Guid.NewGuid().ToString("N").Substring(0, 6);
        return $"FinCore@{guidPart}";
    }
}
