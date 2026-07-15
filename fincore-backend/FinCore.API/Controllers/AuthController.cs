using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinCore.Application.Features.Auth.Commands.ChangePassword;
using FinCore.Application.Features.Auth.Commands.Login;
using FinCore.Application.Features.Auth.Commands.ForgotPassword;

namespace FinCore.API.Controllers;

public class AuthController : ApiControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginCommand command)
    {
        try
        {
            var response = await Mediator.Send(command);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<bool>> ForgotPassword([FromBody] ForgotPasswordCommand command)
    {
        try
        {
            var response = await Mediator.Send(command);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult<bool>> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Không xác định được người dùng." });
            }

            var command = new ChangePasswordCommand(userId, request.OldPassword, request.NewPassword);
            var result = await Mediator.Send(command);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public class ChangePasswordRequest
{
    public string OldPassword { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
}
