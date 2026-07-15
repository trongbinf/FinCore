using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinCore.Application.Features.Users.Commands.CreateUser;
using FinCore.Application.Features.Users.Commands.UpdateUser;
using FinCore.Application.Features.Users.Commands.ToggleUserLock;
using FinCore.Application.Features.Users.Commands.ResetUserPassword;

namespace FinCore.API.Controllers;

[Authorize(Roles = "Admin")]
public class UserController : ApiControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CreateUserResponse>> Create([FromBody] CreateUserCommand command)
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

    [HttpPut("{id}")]
    public async Task<ActionResult<bool>> Update(Guid id, [FromBody] UpdateUserCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest(new { message = "Mã tài khoản không khớp." });
        }

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

    [HttpPost("lock")]
    public async Task<ActionResult<bool>> ToggleLock([FromBody] ToggleUserLockCommand command)
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

    [HttpPost("reset-password/{id}")]
    public async Task<ActionResult<ResetUserPasswordResponse>> ResetPassword(Guid id)
    {
        try
        {
            var response = await Mediator.Send(new ResetUserPasswordCommand(id));
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
