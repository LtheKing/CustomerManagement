using Microsoft.AspNetCore.Mvc;
using customer.management.api.Helpers;
using customer.management.api.Interfaces;
using customer.management.api.Models;

namespace customer.management.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExpenseController : ControllerBase
    {
        private readonly IExpenseService _expenseService;

        public ExpenseController(IExpenseService expenseService)
        {
            _expenseService = expenseService;
        }

        // GET: api/expense
        [HttpGet]
        public async Task<ActionResult> GetExpenses([FromQuery] GetExpensePagedRequest request)
        {
            try
            {
                var pagedResult = await _expenseService.GetExpensesPagedAsync(request);
                return Ok(pagedResult);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while retrieving expenses", details = ex.Message });
            }
        }

        // POST: api/expense
        [HttpPost]
        public async Task<ActionResult<ExpenseDto>> CreateExpense(CreateExpenseDto createDto)
        {
            try
            {
                var performedBy = ActorHelper.GetPerformedByUserId(this, createDto.PerformedByUserId);
                var result = await _expenseService.CreateExpenseAsync(createDto, performedBy);
                return CreatedAtAction(nameof(GetExpenses), new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while creating the expense", details = ex.Message });
            }
        }
    }
}
