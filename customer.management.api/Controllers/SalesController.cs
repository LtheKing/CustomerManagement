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
        public async Task<ActionResult> GetSales([FromQuery] GetSalesPagedRequest request)
        {
            try
            {
                var hasPaginationParams = Request.Query.ContainsKey("page") || Request.Query.ContainsKey("pageSize");
                
                if (hasPaginationParams)
                {
                    var pagedResult = await _salesService.GetSalesPagedAsync(request);
                    return Ok(pagedResult);
                }

                IEnumerable<SalesDto> result;

                if (request.CustomerId.HasValue)
                {
                    result = await _salesService.GetSalesByCustomerIdAsync(request.CustomerId.Value);
                }
                else if (request.StartDate.HasValue && request.EndDate.HasValue)
                {
                    result = await _salesService.GetSalesByDateRangeAsync(request.StartDate.Value, request.EndDate.Value);
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

        // GET: api/sales/grouped — one row per checkout (TransactionId)
        [HttpGet("grouped")]
        public async Task<ActionResult> GetSalesGrouped([FromQuery] GetSalesPagedRequest request)
        {
            try
            {
                var pagedResult = await _salesService.GetSalesGroupedPagedAsync(request);
                return Ok(pagedResult);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while retrieving grouped sales", details = ex.Message });
            }
        }

        // GET: api/sales/5
        [HttpGet("{id:guid}")]
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

