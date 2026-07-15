using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using FinCore.Application.Interfaces;

namespace FinCore.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string message)
    {
        var smtpSection = _configuration.GetSection("Smtp");
        var emailUser = smtpSection["EmailUser"] ?? throw new InvalidOperationException("EmailUser configuration is missing.");
        var emailPass = smtpSection["EmailPass"] ?? throw new InvalidOperationException("EmailPass configuration is missing.");
        var host = smtpSection["Host"] ?? "smtp.gmail.com";
        var portStr = smtpSection["Port"] ?? "587";
        int.TryParse(portStr, out var port);

        using var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(emailUser, emailPass),
            EnableSsl = true // Gmail port 587 STARTTLS requires EnableSsl = true in .NET SmtpClient
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(emailUser, "FinCore Finance"),
            Subject = subject,
            Body = message,
            IsBodyHtml = true
        };

        mailMessage.To.Add(toEmail);

        await client.SendMailAsync(mailMessage);
    }
}
