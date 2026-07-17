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

        public async Task<PagedResult<SalesDto>> GetSalesPagedAsync(GetSalesPagedRequest request)
        {
            if (request.Page < 1) request.Page = 1;
            if (request.PageSize < 1) request.PageSize = 20;
            if (request.PageSize > 100) request.PageSize = 100;

            var query = BuildFilteredSalesQuery(request);

            var totalCount = await query.CountAsync();

            var sales = await query
                .OrderByDescending(s => s.SaleDate)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return new PagedResult<SalesDto>
            {
                Data = sales.Select(s => MapToDto(s)).ToList(),
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }

        public async Task<PagedResult<SalesTransactionGroupDto>> GetSalesGroupedPagedAsync(GetSalesPagedRequest request)
        {
            if (request.Page < 1) request.Page = 1;
            if (request.PageSize < 1) request.PageSize = 20;
            if (request.PageSize > 100) request.PageSize = 100;

            var sales = await BuildFilteredSalesQuery(request).ToListAsync();

            var groups = sales
                .GroupBy(s => s.TransactionId)
                .Select(g =>
                {
                    var orderedItems = g.OrderBy(s => s.Product?.Name).ToList();
                    var first = orderedItems.OrderByDescending(s => s.SaleDate).First();

                    return new SalesTransactionGroupDto
                    {
                        TransactionId = g.Key,
                        CustomerId = first.CustomerId,
                        CustomerName = first.Customer?.Name ?? "Unknown",
                        CashierName = first.CashierName,
                        SaleDate = orderedItems.Max(s => s.SaleDate),
                        ItemCount = orderedItems.Count,
                        TotalQuantity = orderedItems.Sum(s => s.Quantity),
                        TotalAmount = orderedItems.Sum(s => s.Amount),
                        Items = orderedItems.Select(s => new SalesTransactionItemDto
                        {
                            Id = s.Id,
                            ProductId = s.ProductId,
                            ProductName = s.Product?.Name ?? "Unknown",
                            Quantity = s.Quantity,
                            Amount = s.Amount
                        }).ToList()
                    };
                })
                .OrderByDescending(g => g.SaleDate)
                .ToList();

            var totalCount = groups.Count;
            var pagedGroups = groups
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();

            return new PagedResult<SalesTransactionGroupDto>
            {
                Data = pagedGroups,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }

        /// <summary>
        /// Create a new sales line item.
        /// Pass the same TransactionId for every product in one checkout so the report can group them.
        /// Decreases product stock and creates a CashFlow entry.
        /// </summary>
        public async Task<SalesDto> CreateSalesAsync(CreateSalesDto createDto)
        {
            if (!createDto.CustomerId.HasValue && string.IsNullOrWhiteSpace(createDto.CustomerName))
            {
                throw new ArgumentException("Either CustomerId or CustomerName must be provided");
            }

            var product = await _context.Products.FindAsync(createDto.ProductId);
            if (product == null)
            {
                throw new ArgumentException($"Product with ID {createDto.ProductId} not found");
            }

            if (!product.IsActive)
            {
                throw new ArgumentException($"Product '{product.Name}' is not active.");
            }

            if (product.Stock < createDto.Quantity)
            {
                throw new ArgumentException(
                    $"Insufficient stock for '{product.Name}'. Available: {product.Stock}, requested: {createDto.Quantity}.");
            }

            var user = await _context.Users.FindAsync(createDto.CreatedBy);
            if (user == null)
            {
                throw new ArgumentException($"User with ID {createDto.CreatedBy} not found");
            }

            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    CustomerModelEntity? customer;
                    Guid resolvedCustomerId;

                    if (createDto.CustomerId.HasValue)
                    {
                        customer = await _context.Customers.FindAsync(createDto.CustomerId.Value);
                        if (customer == null)
                        {
                            throw new ArgumentException($"Customer with ID {createDto.CustomerId.Value} not found");
                        }
                        resolvedCustomerId = customer.Id;
                    }
                    else
                    {
                        var customerName = createDto.CustomerName!.Trim();

                        customer = await _context.Customers
                            .FirstOrDefaultAsync(c => c.Name.ToLower() == customerName.ToLower());

                        if (customer != null)
                        {
                            resolvedCustomerId = customer.Id;
                        }
                        else
                        {
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
                            await _context.SaveChangesAsync();
                            resolvedCustomerId = customer.Id;
                        }
                    }

                    var saleId = Guid.NewGuid();
                    var sale = new SalesModelEntity
                    {
                        Id = saleId,
                        TransactionId = createDto.TransactionId ?? saleId,
                        CustomerId = resolvedCustomerId,
                        ProductId = createDto.ProductId,
                        Quantity = createDto.Quantity,
                        Amount = createDto.Amount,
                        CashierName = createDto.CashierName,
                        SaleDate = createDto.SaleDate ?? DateTime.UtcNow,
                        CreatedBy = createDto.CreatedBy
                    };

                    _context.Sales.Add(sale);

                    product.Stock -= createDto.Quantity;
                    product.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();

                    var cashFlow = new CashFlowModelEntity
                    {
                        Id = Guid.NewGuid(),
                        FlowType = "SALES",
                        ReferenceId = sale.Id,
                        Amount = sale.Amount,
                        FlowDate = new DateTimeOffset(sale.SaleDate, TimeSpan.Zero),
                        Info = $"Sales transaction: {product.Name} x{sale.Quantity} to {customer.Name}"
                    };

                    _context.CashFlows.Add(cashFlow);
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();

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
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

        /// <summary>
        /// Create all cart line items in one DB transaction (one customer resolve, one commit).
        /// </summary>
        public async Task<IReadOnlyList<SalesDto>> CreateSalesBatchAsync(CreateBatchSalesDto createDto)
        {
            if (!createDto.CustomerId.HasValue && string.IsNullOrWhiteSpace(createDto.CustomerName))
            {
                throw new ArgumentException("Either CustomerId or CustomerName must be provided");
            }

            if (createDto.Items == null || createDto.Items.Count == 0)
            {
                throw new ArgumentException("At least one cart item is required");
            }

            var user = await _context.Users.FindAsync(createDto.CreatedBy);
            if (user == null)
            {
                throw new ArgumentException($"User with ID {createDto.CreatedBy} not found");
            }

            var productIds = createDto.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            foreach (var item in createDto.Items)
            {
                if (!products.TryGetValue(item.ProductId, out var product))
                {
                    throw new ArgumentException($"Product with ID {item.ProductId} not found");
                }

                if (!product.IsActive)
                {
                    throw new ArgumentException($"Product '{product.Name}' is not active.");
                }

                if (product.Stock < item.Quantity)
                {
                    throw new ArgumentException(
                        $"Insufficient stock for '{product.Name}'. Available: {product.Stock}, requested: {item.Quantity}.");
                }
            }

            // Aggregate stock checks when the same product appears more than once
            foreach (var group in createDto.Items.GroupBy(i => i.ProductId))
            {
                var product = products[group.Key];
                var totalQty = group.Sum(i => i.Quantity);
                if (product.Stock < totalQty)
                {
                    throw new ArgumentException(
                        $"Insufficient stock for '{product.Name}'. Available: {product.Stock}, requested: {totalQty}.");
                }
            }

            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    CustomerModelEntity? customer;
                    Guid resolvedCustomerId;

                    if (createDto.CustomerId.HasValue)
                    {
                        customer = await _context.Customers.FindAsync(createDto.CustomerId.Value);
                        if (customer == null)
                        {
                            throw new ArgumentException($"Customer with ID {createDto.CustomerId.Value} not found");
                        }
                        resolvedCustomerId = customer.Id;
                    }
                    else
                    {
                        var customerName = createDto.CustomerName!.Trim();

                        customer = await _context.Customers
                            .FirstOrDefaultAsync(c => c.Name.ToLower() == customerName.ToLower());

                        if (customer != null)
                        {
                            resolvedCustomerId = customer.Id;
                        }
                        else
                        {
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
                            await _context.SaveChangesAsync();
                            resolvedCustomerId = customer.Id;
                        }
                    }

                    var transactionId = createDto.TransactionId ?? Guid.NewGuid();
                    var saleDate = createDto.SaleDate ?? DateTime.UtcNow;
                    var createdSaleIds = new List<Guid>();

                    foreach (var item in createDto.Items)
                    {
                        var product = products[item.ProductId];
                        var saleId = Guid.NewGuid();

                        _context.Sales.Add(new SalesModelEntity
                        {
                            Id = saleId,
                            TransactionId = transactionId,
                            CustomerId = resolvedCustomerId,
                            ProductId = item.ProductId,
                            Quantity = item.Quantity,
                            Amount = item.Amount,
                            CashierName = createDto.CashierName,
                            SaleDate = saleDate,
                            CreatedBy = createDto.CreatedBy
                        });

                        product.Stock -= item.Quantity;
                        product.UpdatedAt = DateTime.UtcNow;

                        _context.CashFlows.Add(new CashFlowModelEntity
                        {
                            Id = Guid.NewGuid(),
                            FlowType = "SALES",
                            ReferenceId = saleId,
                            Amount = item.Amount,
                            FlowDate = new DateTimeOffset(saleDate, TimeSpan.Zero),
                            Info = $"Sales transaction: {product.Name} x{item.Quantity} to {customer.Name}"
                        });

                        createdSaleIds.Add(saleId);
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    var createdSales = await _context.Sales
                        .Include(s => s.Customer)
                        .Include(s => s.Product)
                        .Include(s => s.User)
                        .Where(s => createdSaleIds.Contains(s.Id))
                        .ToListAsync();

                    return createdSales.Select(MapToDto).ToList();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

        private IQueryable<SalesModelEntity> BuildFilteredSalesQuery(GetSalesPagedRequest request)
        {
            var query = _context.Sales
                .Include(s => s.Customer)
                .Include(s => s.Product)
                .Include(s => s.User)
                .AsQueryable();

            if (request.CustomerId.HasValue)
            {
                query = query.Where(s => s.CustomerId == request.CustomerId.Value);
            }

            if (request.ProductId.HasValue)
            {
                query = query.Where(s => s.ProductId == request.ProductId.Value);
            }

            if (!string.IsNullOrWhiteSpace(request.CashierName))
            {
                query = query.Where(s => s.CashierName != null && s.CashierName == request.CashierName);
            }

            if (request.StartDate.HasValue)
            {
                query = query.Where(s => s.SaleDate >= request.StartDate.Value);
            }

            if (request.EndDate.HasValue)
            {
                var endDateTime = request.EndDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(s => s.SaleDate <= endDateTime);
            }

            return query;
        }

        private SalesDto MapToDto(SalesModelEntity sale)
        {
            return new SalesDto
            {
                Id = sale.Id,
                TransactionId = sale.TransactionId,
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
