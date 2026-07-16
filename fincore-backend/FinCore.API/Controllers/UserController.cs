using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinCore.Application.Features.Users.Commands.CreateUser;
using FinCore.Application.Features.Users.Commands.UpdateUser;
using FinCore.Application.Features.Users.Commands.ToggleUserLock;
using FinCore.Application.Features.Users.Commands.ResetUserPassword;

using Microsoft.EntityFrameworkCore;
using FinCore.Application.Interfaces;
using FinCore.Domain.Enums;
using System.Collections.Generic;
using System.Linq;

namespace FinCore.API.Controllers;

[Authorize(Roles = "Admin")]
public class UserController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;

    public UserController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<object>>> GetUsers()
    {
        try
        {
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    id = u.Id.ToString(),
                    fullName = u.FullName,
                    email = u.Email,
                    phone = u.Phone,
                    role = u.Role == UserRole.Admin ? "Admin" : "Member",
                    isActive = u.IsActive,
                    createdAt = u.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
                })
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

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
