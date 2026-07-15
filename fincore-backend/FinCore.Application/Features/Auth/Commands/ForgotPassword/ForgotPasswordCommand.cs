using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;
using FinCore.Domain.Entities;

namespace FinCore.Application.Features.Auth.Commands.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest<bool>;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;

    public ForgotPasswordCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IEmailService emailService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
    }

    public async Task<bool> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive, cancellationToken);

        if (user == null)
        {
            throw new Exception("Email không tồn tại hoặc tài khoản đã bị khóa.");
        }

        // Generate temporary password
        var temporaryPassword = GenerateTemporaryPassword();
        user.PasswordHash = _passwordHasher.HashPassword(temporaryPassword);
        user.IsPasswordTemp = true; // Force password reset on next login

        var log = new ActivityLog
        {
            UserId = user.Id, // The user requested password recovery
            Action = "Khôi phục mật khẩu",
            EntityName = "User",
            EntityId = user.Id,
            Description = $"Yêu cầu khôi phục mật khẩu cho tài khoản '{user.Email}'. Hệ thống đã cấp mật khẩu tạm mới.",
            Timestamp = FinCore.Domain.Common.TimeHelper.GetVietnamTime()
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync(cancellationToken);

        // Send recovery email
        try
        {
            var subject = "Khôi phục mật khẩu tài khoản FinCore";
            var body = $@"
                <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);'>
                    <h2 style='color: #059669; margin-top: 0;'>Yêu cầu cấp lại mật khẩu!</h2>
                    <p>Chào {user.FullName},</p>
                    <p>Hệ thống FinCore đã nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.</p>
                    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;' />
                    <p><strong>Thông tin mật khẩu mới:</strong></p>
                    <table style='width: 100%; border-collapse: collapse; margin-bottom: 16px;'>
                        <tr>
                            <td style='padding: 8px 0; color: #6b7280; width: 120px;'>Tài khoản:</td>
                            <td style='padding: 8px 0; font-weight: bold;'>{user.Email}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; color: #6b7280;'>Mật khẩu tạm:</td>
                            <td style='padding: 8px 0; font-weight: bold; color: #dc2626;'>{temporaryPassword}</td>
                        </tr>
                    </table>
                    <div style='background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; margin-bottom: 16px;'>
                        <p style='margin: 0; color: #b45309; font-size: 0.9em;'>
                            <strong>Lưu ý:</strong> Để bảo mật, vui lòng dùng mật khẩu tạm thời trên để đăng nhập và đổi sang mật khẩu mới ngay lập tức.
                        </p>
                    </div>
                    <p style='margin-bottom: 0; font-size: 0.9em; color: #9ca3af;'>Trân trọng,<br/>Đội ngũ FinCore Support</p>
                </div>";

            await _emailService.SendEmailAsync(user.Email!, subject, body);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Recovery email sending failed: {ex.Message}");
            throw new Exception("Không thể gửi email khôi phục mật khẩu. Vui lòng liên hệ Admin.");
        }

        return true;
    }

    private string GenerateTemporaryPassword()
    {
        var guidPart = Guid.NewGuid().ToString("N").Substring(0, 6);
        return $"FinCore@{guidPart}";
    }
}
