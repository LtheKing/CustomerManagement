using Microsoft.AspNetCore.Mvc;
using customer.management.api.Interfaces;
using customer.management.api.Models;

namespace customer.management.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CashFlowController : ControllerBase
    {
        private readonly ICashFlowService _cashFlowService;

        public CashFlowController(ICashFlowService cashFlowService)
        {
            _cashFlowService = cashFlowService;
        }

        // GET: api/cashflow
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CapitalCashBalanceDto>>> GetCapitalCash()
        {
            var result = await _cashFlowService.GetCapitalCashBalanceAsync();
            return Ok(result);
        }

        // GET: api/cashflow/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CapitalCashBalanceDto>> GetCapitalCash(Guid id)
        {
            var result = await _cashFlowService.GetCapitalCashBalanceByIdAsync(id);
            return Ok(result);
        }

        // GET: api/cashflow/latest
        [HttpGet("latest")]
        public async Task<ActionResult<CapitalCashBalanceDto>> GetLatestCapitalCash()
        {
            var result = await _cashFlowService.GetLatestCapitalCashBalanceAsync();
            return Ok(result);
        }
    }
}

