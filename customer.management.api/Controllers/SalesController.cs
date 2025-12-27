using Microsoft.AspNetCore.Mvc;
using customer.management.api.Interfaces;
using customer.management.api.Models;

namespace customer.management.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalesController : ControllerBase
    {
        private readonly ISalesService _salesService;

        public SalesController(ISalesService salesService)
        {
            _salesService = salesService;
        }

        // GET: api/sales
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SalesDto>>> GetSales(
            [FromQuery] Guid? customerId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                IEnumerable<SalesDto> result;

                if (customerId.HasValue)
                {
                    result = await _salesService.GetSalesByCustomerIdAsync(customerId.Value);
                }
                else if (startDate.HasValue && endDate.HasValue)
                {
                    result = await _salesService.GetSalesByDateRangeAsync(startDate.Value, endDate.Value);
                }
                else
                {
                    result = await _salesService.GetAllSalesAsync();
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while retrieving sales", details = ex.Message });
            }
        }

        // GET: api/sales/5
        [HttpGet("{id}")]
        public async Task<ActionResult<SalesDto>> GetSales(Guid id)
        {
            try
            {
                var result = await _salesService.GetSalesByIdAsync(id);

                if (result == null)
                {
                    return NotFound(new { error = $"Sales with ID {id} not found" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while retrieving the sale", details = ex.Message });
            }
        }

        // POST: api/sales
        [HttpPost]
        public async Task<ActionResult<SalesDto>> CreateSales(CreateSalesDto createDto)
        {
            try
            {
                var result = await _salesService.CreateSalesAsync(createDto);
                return CreatedAtAction(nameof(GetSales), new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while creating the sales transaction", details = ex.Message });
            }
        }
    }
}

