using Microsoft.EntityFrameworkCore;
using customer.management.data.entity.DbContext;
using customer.management.data.entity.Models;
using customer.management.api.Interfaces;
using customer.management.api.Models;

namespace customer.management.api.Services
{
    public class ExpenseService : IExpenseService
    {
        private readonly CustomerManagementDbContext _context;
        private readonly IUserActivityService _userActivityService;

        public ExpenseService(CustomerManagementDbContext context, IUserActivityService userActivityService)
        {
            _context = context;
            _userActivityService = userActivityService;
        }

        /// <summary>
        /// Get paginated expenses with optional filters
        /// </summary>
        public async Task<PagedResult<ExpenseDto>> GetExpensesPagedAsync(GetExpensePagedRequest request)
        {
            // Validate pagination parameters
            if (request.Page < 1) request.Page = 1;
            if (request.PageSize < 1) request.PageSize = 20;
            if (request.PageSize > 100) request.PageSize = 100; // Max page size limit

            // Build query
            var query = _context.Expenses.AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(request.Description))
            {
                var descriptionLower = request.Description.ToLower();
                query = query.Where(e => e.Description.ToLower().Contains(descriptionLower));
            }

            if (request.MinAmount.HasValue)
            {
                query = query.Where(e => e.Amount >= request.MinAmount.Value);
            }

            if (request.MaxAmount.HasValue)
            {
                query = query.Where(e => e.Amount <= request.MaxAmount.Value);
            }

            if (request.StartDate.HasValue)
            {
                var startDateOffset = new DateTimeOffset(request.StartDate.Value, TimeSpan.Zero);
                query = query.Where(e => e.ExpenseDate >= startDateOffset);
            }

            if (request.EndDate.HasValue)
            {
                // Include the entire end date (up to end of day)
                var endDateTime = request.EndDate.Value.Date.AddDays(1).AddTicks(-1);
                var endDateOffset = new DateTimeOffset(endDateTime, TimeSpan.Zero);
                query = query.Where(e => e.ExpenseDate <= endDateOffset);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply ordering and pagination
            var expenses = await query
                .OrderByDescending(e => e.ExpenseDate)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            // Map to DTOs
            var data = expenses.Select(e => MapToDto(e)).ToList();

            return new PagedResult<ExpenseDto>
            {
                Data = data,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }

        /// <summary>
        /// Create a new expense record
        /// Also creates a corresponding CashFlow entry with FlowType "EXPENSE"
        /// All operations are wrapped in a database transaction for atomicity
        /// Uses execution strategy to support retry on failure
        /// </summary>
        public async Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto, Guid? performedByUserId)
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            var created = await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var expense = new ExpenseModelEntity
                    {
                        Id = Guid.NewGuid(),
                        Description = createDto.Description.Trim(),
                        Amount = createDto.Amount,
                        ExpenseDate = createDto.ExpenseDate ?? DateTimeOffset.UtcNow
                    };

                    _context.Expenses.Add(expense);

                    // FlowType "EXPENSE" subtracts from capital (handled in balance calculation)
                    _context.CashFlows.Add(new CashFlowModelEntity
                    {
                        Id = Guid.NewGuid(),
                        FlowType = "EXPENSE",
                        ReferenceId = expense.Id,
                        Amount = expense.Amount, // Store as positive; balance calc subtracts it
                        FlowDate = expense.ExpenseDate,
                        Info = $"Expense: {expense.Description}"
                    });

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return MapToDto(expense);
                }
                catch
                {
                    await transaction.RollbackAsync();
                    _context.ChangeTracker.Clear();
                    throw;
                }
            });

            // Audit log MUST stay outside the retryable transaction.
            // If it ran after Commit inside ExecuteAsync and then failed,
            // EF would retry and insert a second expense + cashflow (2x amount).
            if (performedByUserId.HasValue)
            {
                try
                {
                    await _userActivityService.LogAsync(
                        performedByUserId.Value,
                        "CREATE_EXPENSE",
                        "Expense",
                        created.Id,
                        $"Created expense '{created.Description}' for {created.Amount:N2}");
                }
                catch
                {
                    // Never fail or retry the create because of audit logging.
                }
            }

            return created;
        }

        /// <summary>
        /// Map entity to DTO
        /// </summary>
        private ExpenseDto MapToDto(ExpenseModelEntity expense)
        {
            return new ExpenseDto
            {
                Id = expense.Id,
                Description = expense.Description,
                Amount = expense.Amount,
                ExpenseDate = expense.ExpenseDate
            };
        }
    }
}

