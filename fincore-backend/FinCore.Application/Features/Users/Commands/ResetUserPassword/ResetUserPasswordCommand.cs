using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;
using FinCore.Domain.Entities;

namespace FinCore.Application.Features.Users.Commands.ResetUserPassword;

public record ResetUserPasswordCommand(Guid Id) : IRequest<ResetUserPasswordResponse>;

public record ResetUserPasswordResponse(bool Success);

public class ResetUserPasswordCommandHandler : IRequestHandler<ResetUserPasswordCommand, ResetUserPasswordResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUserService;
    private readonly IEmailService _emailService;

    public ResetUserPasswordCommandHandler(
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

    public async Task<ResetUserPasswordResponse> Handle(ResetUserPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (user == null)
        {
            throw new Exception("Tài khoản không tồn tại.");
        }

        var temporaryPassword = GenerateTemporaryPassword();
        user.PasswordHash = _passwordHasher.HashPassword(temporaryPassword);
        user.IsPasswordTemp = true; // Force password reset on next login

        var userIdStr = _currentUserService.UserId;
        Guid.TryParse(userIdStr, out var userId);

        var log = new ActivityLog
        {
            UserId = userId,
            Action = "Đổi mật khẩu",
            EntityName = "User",
            EntityId = user.Id,
            Description = $"Đặt lại mật khẩu tạm cho thành viên '{user.Email}' ({user.FullName}).",
            Timestamp = FinCore.Domain.Common.TimeHelper.GetVietnamTime()
        };
        _context.ActivityLogs.Add(log);

        // Send email notification first. If it throws, db changes are rolled back.
        try
        {
            var subject = "Đặt lại mật khẩu tài khoản FinCore";
            var body = $@"
                <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);'>
                    <h2 style='color: #dc2626; margin-top: 0;'>Thông báo đặt lại mật khẩu!</h2>
                    <p>Yêu cầu đặt lại mật khẩu tài khoản FinCore của bạn đã được thực hiện thành công bởi Ban quản trị.</p>
                    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;' />
                    <p><strong>Thông tin đăng nhập mới của bạn:</strong></p>
                    <table style='width: 100%; border-collapse: collapse; margin-bottom: 16px;'>
                        <tr>
                            <td style='padding: 8px 0; color: #6b7280; width: 120px;'>Tài khoản Email:</td>
                            <td style='padding: 8px 0; font-weight: bold;'>{user.Email}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; color: #6b7280;'>Mật khẩu tạm mới:</td>
                            <td style='padding: 8px 0; font-weight: bold; color: #dc2626;'>{temporaryPassword}</td>
                        </tr>
                    </table>
                    <div style='background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; margin-bottom: 16px;'>
                        <p style='margin: 0; color: #b45309; font-size: 0.9em;'>
                            <strong>Lưu ý:</strong> Mật khẩu mới trên là mật khẩu tạm thời. Hệ thống sẽ yêu cầu bạn đổi mật khẩu mới trong lần đăng nhập tiếp theo để bảo vệ tài khoản của mình.
                        </p>
                    </div>
                    <p style='margin-bottom: 0; font-size: 0.9em; color: #9ca3af;'>Trân trọng,<br/>Đội ngũ FinCore Support</p>
                </div>";

            await _emailService.SendEmailAsync(user.Email!, subject, body);
        }
        catch (Exception ex)
        {
            throw new Exception($"Không thể gửi email thông báo mật khẩu mới. Lỗi: {ex.Message}. Vui lòng kiểm tra lại địa chỉ email hoặc kết nối SMTP.");
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new ResetUserPasswordResponse(true);
    }

    private string GenerateTemporaryPassword()
    {
        var guidPart = Guid.NewGuid().ToString("N").Substring(0, 6);
        return $"FinCore@{guidPart}";
    }
}
