using System.Security.Claims;
using FinCore.Domain.Entities;

namespace FinCore.Application.Interfaces;

public interface ITokenService
{
    string GenerateJwtToken(User user);
}
