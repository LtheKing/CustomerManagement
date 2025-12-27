using Microsoft.EntityFrameworkCore;
using customer.management.data.entity.DbContext;
using customer.management.data.entity.Models;
using customer.management.api.Interfaces;
using customer.management.api.Models;

namespace customer.management.api.Services
{
    public class SalesService : ISalesService
    {
        private readonly CustomerManagementDbContext _context;
        private readonly ICashFlowService _cashFlowService;

        public SalesService(CustomerManagementDbContext context, ICashFlowService cashFlowService)
        {
            _context = context;
            _cashFlowService = cashFlowService;
        }

        /// <summary>
        /// Get all sales with related customer and product information
        /// </summary>
        public async Task<IEnumerable<SalesDto>> GetAllSalesAsync()
        {
            var sales = await _context.Sales
                .Include(s => s.Customer)
                .Include(s => s.Product)
                .Include(s => s.User)
                .OrderByDescending(s => s.SaleDate)
                .ToListAsync();

            return sales.Select(s => MapToDto(s));
        }

        /// <summary>
        /// Get sales by ID
        /// </summary>
        public async Task<SalesDto?> GetSalesByIdAsync(Guid id)
        {
            var sale = await _context.Sales
                .Include(s => s.Customer)
                .Include(s => s.Product)
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sale == null)
            {
                return null;
            }

            return MapToDto(sale);
        }

        /// <summary>
        /// Get sales by customer ID
        /// </summary>
        public async Task<IEnumerable<SalesDto>> GetSalesByCustomerIdAsync(Guid customerId)
        {
            var sales = await _context.Sales
                .Include(s => s.Customer)
                .Include(s => s.Product)
                .Include(s => s.User)
                .Where(s => s.CustomerId == customerId)
                .OrderByDescending(s => s.SaleDate)
                .ToListAsync();

            return sales.Select(s => MapToDto(s));
        }

        /// <summary>
        /// Get sales by date range
        /// </summary>
        public async Task<IEnumerable<SalesDto>> GetSalesByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            var sales = await _context.Sales
                .Include(s => s.Customer)
                .Include(s => s.Product)
                .Include(s => s.User)
                .Where(s => s.SaleDate >= startDate && s.SaleDate <= endDate)
                .OrderByDescending(s => s.SaleDate)
                .ToListAsync();

            return sales.Select(s => MapToDto(s));
        }

        /// <summary>
        /// Create a new sales transaction
        /// Hybrid approach: Either CustomerId OR CustomerName must be provided
        /// Also creates a corresponding CashFlow entry with FlowType "SALES"
        /// All operations are wrapped in a database transaction for atomicity
        /// Uses execution strategy to support retry on failure
        /// </summary>
        public async Task<SalesDto> CreateSalesAsync(CreateSalesDto createDto)
        {
            // Validate that either CustomerId or CustomerName is provided
            if (!createDto.CustomerId.HasValue && string.IsNullOrWhiteSpace(createDto.CustomerName))
            {
                throw new ArgumentException("Either CustomerId or CustomerName must be provided");
            }

            // Validate product exists
            var product = await _context.Products.FindAsync(createDto.ProductId);
            if (product == null)
            {
                throw new ArgumentException($"Product with ID {createDto.ProductId} not found");
            }

            // Validate user exists
            var user = await _context.Users.FindAsync(createDto.CreatedBy);
            if (user == null)
            {
                throw new ArgumentException($"User with ID {createDto.CreatedBy} not found");
            }

            // Use execution strategy to support retry on failure with transactions
            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                // Use database transaction to ensure atomicity
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Resolve customer: Find existing or create new
                    CustomerModelEntity customer;
                    Guid resolvedCustomerId;

                    if (createDto.CustomerId.HasValue)
                    {
                        // Scenario A: CustomerId provided - must exist
                        customer = await _context.Customers.FindAsync(createDto.CustomerId.Value);
                        if (customer == null)
                        {
                            throw new ArgumentException($"Customer with ID {createDto.CustomerId.Value} not found");
                        }
                        resolvedCustomerId = customer.Id;
                    }
                    else
                    {
                        // Scenario B: CustomerName provided - find or create
                        var customerName = createDto.CustomerName!.Trim();

                        // Check for existing customer (case-insensitive)
                        customer = await _context.Customers
                            .FirstOrDefaultAsync(c => c.Name.ToLower() == customerName.ToLower());

                        if (customer != null)
                        {
                            // Use existing customer
                            resolvedCustomerId = customer.Id;
                        }
                        else
                        {
                            // Create new customer
                            customer = new CustomerModelEntity
                            {
                                Id = Guid.NewGuid(),
                                Name = customerName,
                                CreatedBy = createDto.CreatedBy,
                                CreatedAt = DateTime.UtcNow,
                                Email = null,
                                Phone = null,
                                Address = null,
                                Company = null,
                                UpdatedAt = null
                            };

                            _context.Customers.Add(customer);
                            // Save customer to get the ID (within transaction)
                            await _context.SaveChangesAsync();
                            resolvedCustomerId = customer.Id;
                        }
                    }

                    // Create new Sales entity
                    var sale = new SalesModelEntity
                    {
                        Id = Guid.NewGuid(),
                        CustomerId = resolvedCustomerId,
                        ProductId = createDto.ProductId,
                        Quantity = createDto.Quantity,
                        Amount = createDto.Amount,
                        CashierName = createDto.CashierName,
                        SaleDate = createDto.SaleDate ?? DateTime.UtcNow,
                        CreatedBy = createDto.CreatedBy
                    };

                    // Add to context
                    _context.Sales.Add(sale);

                    // Save to get the sale ID (within transaction)
                    await _context.SaveChangesAsync();

                    // Create corresponding CashFlow entry directly in the same context
                    // (instead of using CashFlowService to keep everything in one transaction)
                    var cashFlow = new CashFlowModelEntity
                    {
                        Id = Guid.NewGuid(),
                        FlowType = "SALES",
                        ReferenceId = sale.Id, // Reference to the sales transaction
                        Amount = sale.Amount,
                        FlowDate = new DateTimeOffset(sale.SaleDate, TimeSpan.Zero), // Convert DateTime to DateTimeOffset
                        Info = $"Sales transaction: {product.Name} x{sale.Quantity} to {customer.Name}"
                    };

                    _context.CashFlows.Add(cashFlow);
                    await _context.SaveChangesAsync();

                    // Commit transaction - all operations succeed
                    await transaction.CommitAsync();

                    // Reload sale with related entities for DTO mapping
                    var createdSale = await _context.Sales
                        .Include(s => s.Customer)
                        .Include(s => s.Product)
                        .Include(s => s.User)
                        .FirstOrDefaultAsync(s => s.Id == sale.Id);

                    if (createdSale == null)
                    {
                        throw new InvalidOperationException("Failed to retrieve created sale");
                    }

                    return MapToDto(createdSale);
                }
                catch
                {
                    // Rollback transaction on any error
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

        /// <summary>
        /// Map entity to DTO
        /// </summary>
        private SalesDto MapToDto(SalesModelEntity sale)
        {
            return new SalesDto
            {
                Id = sale.Id,
                CustomerId = sale.CustomerId,
                CustomerName = sale.Customer?.Name ?? "Unknown",
                ProductId = sale.ProductId,
                ProductName = sale.Product?.Name ?? "Unknown",
                Quantity = sale.Quantity,
                Amount = sale.Amount,
                CashierName = sale.CashierName,
                SaleDate = sale.SaleDate,
                CreatedBy = sale.CreatedBy,
                CreatedByUsername = sale.User?.Username
            };
        }
    }
}

