using Microsoft.EntityFrameworkCore;
using customer.management.data.entity.DbContext;
using customer.management.data.entity.Models;
using customer.management.api.Interfaces;
using customer.management.api.Models;

namespace customer.management.api.Services
{
    public class CashFlowService : ICashFlowService
    {
        private readonly CustomerManagementDbContext _context;

        public CashFlowService(CustomerManagementDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Calculate current balance from CashFlow table
        /// Balance = Sum of (SALES, ADJUSTMENT_IN) - Sum of (EXPENSE, ADJUSTMENT_OUT)
        /// Positive flows: SALES, ADJUSTMENT_IN (adds to capital)
        /// Negative flows: EXPENSE, ADJUSTMENT_OUT (subtracts from capital)
        /// </summary>
        public async Task<decimal> CalculateBalanceAsync()
        {
            var cashFlows = await _context.CashFlows.ToListAsync();
            
            decimal balance = 0;
            foreach (var flow in cashFlows)
            {
                var flowTypeUpper = flow.FlowType.ToUpper();
                
                // Positive flows: SALES, ADJUSTMENT_IN (adds to capital)
                if (flowTypeUpper == "SALES" || flowTypeUpper == "ADJUSTMENT_IN")
                {
                    balance += flow.Amount;
                }
                // Negative flows: EXPENSE, ADJUSTMENT_OUT (subtracts from capital)
                else if (flowTypeUpper == "EXPENSE" || flowTypeUpper == "ADJUSTMENT_OUT")
                {
                    balance -= flow.Amount;
                }
                // Unknown flow types are ignored (for safety)
            }
            
            return balance;
        }

        /// <summary>
        /// Get the latest CashFlow record by FlowDate
        /// </summary>
        public async Task<CashFlowModelEntity?> GetLatestCashFlowAsync()
        {
            return await _context.CashFlows
                .OrderByDescending(cf => cf.FlowDate)
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Get capital cash balance as a collection (for GET all endpoint)
        /// </summary>
        public async Task<IEnumerable<CapitalCashBalanceDto>> GetCapitalCashBalanceAsync()
        {
            var balance = await CalculateBalanceAsync();
            var latestCashFlow = await GetLatestCashFlowAsync();

            return new[]
            {
                new CapitalCashBalanceDto
                {
                    Id = latestCashFlow?.Id ?? Guid.Empty,
                    Balance = balance,
                    UpdatedAt = latestCashFlow?.FlowDate ?? DateTimeOffset.UtcNow
                }
            };
        }

        /// <summary>
        /// Get capital cash balance by ID (for GET by id endpoint)
        /// Note: Since balance is calculated from CashFlow, the id parameter is kept for API compatibility
        /// </summary>
        public async Task<CapitalCashBalanceDto> GetCapitalCashBalanceByIdAsync(Guid id)
        {
            var balance = await CalculateBalanceAsync();
            var latestCashFlow = await GetLatestCashFlowAsync();

            return new CapitalCashBalanceDto
            {
                Id = id,
                Balance = balance,
                UpdatedAt = latestCashFlow?.FlowDate ?? DateTimeOffset.UtcNow
            };
        }

        /// <summary>
        /// Get latest capital cash balance (for GET latest endpoint)
        /// </summary>
        public async Task<CapitalCashBalanceDto> GetLatestCapitalCashBalanceAsync()
        {
            var balance = await CalculateBalanceAsync();
            var latestCashFlow = await GetLatestCashFlowAsync();

            if (latestCashFlow == null)
            {
                return new CapitalCashBalanceDto
                {
                    Id = Guid.Empty,
                    Balance = 0m,
                    UpdatedAt = DateTimeOffset.UtcNow
                };
            }

            return new CapitalCashBalanceDto
            {
                Id = latestCashFlow.Id,
                Balance = balance,
                UpdatedAt = latestCashFlow.FlowDate
            };
        }
    }
}

