using System.Threading.Tasks;

namespace FinCore.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string message);
}
