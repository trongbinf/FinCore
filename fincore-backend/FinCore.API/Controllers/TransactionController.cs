using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FinCore.Application.Features.Transactions.Commands.AdjustFund;
using FinCore.Application.Features.Transactions.Commands.ApproveTransaction;
using FinCore.Application.Features.Transactions.Commands.CreateTransaction;
using FinCore.Application.Features.Transactions.Commands.CreateTransactionCategory;
using FinCore.Application.Features.Transactions.Commands.DeleteTransaction;
using FinCore.Application.Features.Transactions.Commands.DeleteTransactionCategory;
using FinCore.Application.Features.Transactions.Commands.UpdateTransaction;
using FinCore.Application.Features.Transactions.Commands.UpdateTransactionCategory;
using FinCore.Application.Features.Transactions.Queries.GetActiveCategories;
using FinCore.Application.Features.Transactions.Queries.GetClubFund;
using FinCore.Application.Features.Transactions.Queries.GetTransactions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinCore.API.Controllers;

[Authorize]
public class TransactionController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TransactionDto>>> Get()
    {
        try
        {
            var response = await Mediator.Send(new GetTransactionsQuery());
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Guid>> Create([FromBody] CreateTransactionCommand command)
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

    [HttpPost("approve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<bool>> Approve([FromBody] ApproveTransactionCommand command)
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

    [HttpGet("categories")]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        try
        {
            var response = await Mediator.Send(new GetActiveCategoriesQuery());
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("categories")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Guid>> CreateCategory(
        [FromBody] CreateTransactionCategoryCommand command
    )
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

    [HttpPut("categories/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<bool>> UpdateCategory(
        Guid id,
        [FromBody] UpdateTransactionCategoryCommand command
    )
    {
        if (id != command.Id)
        {
            return BadRequest(new { message = "Mã danh mục không khớp." });
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

    [HttpDelete("categories/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<bool>> DeleteCategory(Guid id)
    {
        try
        {
            var response = await Mediator.Send(new DeleteTransactionCategoryCommand(id));
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("adjust-fund")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<bool>> AdjustFund([FromBody] AdjustFundCommand command)
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

    [HttpGet("fund")]
    public async Task<ActionResult<ClubFundDto>> GetFund()
    {
        try
        {
            var response = await Mediator.Send(new GetClubFundQuery());
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<bool>> Update(
        Guid id,
        [FromBody] UpdateTransactionCommand command
    )
    {
        if (id != command.Id)
        {
            return BadRequest(new { message = "Mã giao dịch không khớp." });
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

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<bool>> Delete(Guid id)
    {
        try
        {
            var response = await Mediator.Send(new DeleteTransactionCommand(id));
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
