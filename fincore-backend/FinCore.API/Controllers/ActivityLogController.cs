using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinCore.Application.Features.ActivityLogs.Queries.GetActivityLogs;

namespace FinCore.API.Controllers;

[Authorize(Roles = "Admin")]
public class ActivityLogController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ActivityLogDto>>> Get()
    {
        try
        {
            var response = await Mediator.Send(new GetActivityLogsQuery());
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
