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
        private readonly IUserActivityService _userActivityService;

        public CashFlowService(CustomerManagementDbContext context, IUserActivityService userActivityService)
        {
            _context = context;
            _userActivityService = userActivityService;
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

        /// <summary>
        /// Create a new CashFlow entry
        /// </summary>
        public async Task<CashFlowDto> CreateCashFlowAsync(CreateCashFlowDto createDto, Guid? performedByUserId)
        {
            // Validate flow type
            var validFlowTypes = new[] { "SALES", "EXPENSE", "ADJUSTMENT_IN", "ADJUSTMENT_OUT" };
            var flowTypeUpper = createDto.FlowType.ToUpper();
            
            if (!validFlowTypes.Contains(flowTypeUpper))
            {
                throw new ArgumentException($"Invalid FlowType. Must be one of: {string.Join(", ", validFlowTypes)}");
            }

            // Create new CashFlow entity
            var cashFlow = new CashFlowModelEntity
            {
                Id = Guid.NewGuid(),
                FlowType = flowTypeUpper, // Store as uppercase for consistency
                ReferenceId = createDto.ReferenceId,
                Amount = createDto.Amount,
                FlowDate = createDto.FlowDate ?? DateTimeOffset.UtcNow,
                Info = createDto.Info
            };

            // Add to context and save
            _context.CashFlows.Add(cashFlow);
            await _context.SaveChangesAsync();

            if (performedByUserId.HasValue &&
                (flowTypeUpper == "ADJUSTMENT_IN" || flowTypeUpper == "ADJUSTMENT_OUT"))
            {
                var action = flowTypeUpper == "ADJUSTMENT_IN" ? "ADJUST_CAPITAL_IN" : "ADJUST_CAPITAL_OUT";
                var infoPart = string.IsNullOrWhiteSpace(cashFlow.Info) ? "" : $" Info: {cashFlow.Info}";
                await _userActivityService.LogAsync(
                    performedByUserId.Value,
                    action,
                    "CashFlow",
                    cashFlow.Id,
                    $"{flowTypeUpper} amount {cashFlow.Amount:N2}.{infoPart}");
            }

            // Return as DTO
            return new CashFlowDto
            {
                Id = cashFlow.Id,
                FlowType = cashFlow.FlowType,
                ReferenceId = cashFlow.ReferenceId,
                Amount = cashFlow.Amount,
                FlowDate = cashFlow.FlowDate,
                Info = cashFlow.Info
            };
        }
    }
}

