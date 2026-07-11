using Microsoft.EntityFrameworkCore;
using customer.management.data.entity.DbContext;
using customer.management.data.entity.Models;
using customer.management.api.Interfaces;
using customer.management.api.Models;

namespace customer.management.api.Services
{
    public class ProductService : IProductService
    {
        private readonly CustomerManagementDbContext _context;
        private readonly IProductImageService _productImageService;
        private readonly IUserActivityService _userActivityService;

        public ProductService(
            CustomerManagementDbContext context,
            IProductImageService productImageService,
            IUserActivityService userActivityService)
        {
            _context = context;
            _productImageService = productImageService;
            _userActivityService = userActivityService;
        }

        /// <summary>
        /// Get all products
        /// </summary>
        public async Task<IEnumerable<ProductDto>> GetAllProductsAsync()
        {
            var products = await _context.Products
                .OrderBy(p => p.Name)
                .ToListAsync();

            return products.Select(p => MapToDto(p));
        }

        /// <summary>
        /// Get product by ID
        /// </summary>
        public async Task<ProductDto?> GetProductByIdAsync(Guid id)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return null;
            }

            return MapToDto(product);
        }

        /// <summary>
        /// Get only active products
        /// </summary>
        public async Task<IEnumerable<ProductDto>> GetActiveProductsAsync()
        {
            var products = await _context.Products
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();

            return products.Select(p => MapToDto(p));
        }

        /// <summary>
        /// Create a new product
        /// </summary>
        public async Task<ProductDto> CreateProductAsync(CreateProductDto createDto)
        {
            // Validate required fields for create
            if (string.IsNullOrWhiteSpace(createDto.Name))
            {
                throw new ArgumentException("Product name is required.");
            }

            if (string.IsNullOrWhiteSpace(createDto.SKU))
            {
                throw new ArgumentException("SKU is required.");
            }

            if (!createDto.Price.HasValue || createDto.Price.Value <= 0)
            {
                throw new ArgumentException("Price must be greater than 0.");
            }

            // Check if SKU already exists
            var existingProduct = await _context.Products
                .FirstOrDefaultAsync(p => p.SKU == createDto.SKU.Trim());

            if (existingProduct != null)
            {
                throw new ArgumentException($"A product with SKU '{createDto.SKU}' already exists.");
            }

            var product = new ProductsModelEntity
            {
                Id = Guid.NewGuid(),
                Name = createDto.Name.Trim(),
                SKU = createDto.SKU.Trim(),
                Price = createDto.Price.Value,
                Stock = createDto.Stock ?? 0,
                IsActive = createDto.IsActive ?? true,
                ImageUrl = string.IsNullOrWhiteSpace(createDto.ImageUrl) ? null : createDto.ImageUrl.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return MapToDto(product);
        }

        /// <summary>
        /// Update an existing product
        /// </summary>
        public async Task<ProductDto> UpdateProductAsync(Guid id, CreateProductDto updateDto)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                throw new ArgumentException($"Product with ID {id} not found.");
            }

            // Check if SKU is being updated and if it already exists
            if (!string.IsNullOrWhiteSpace(updateDto.SKU) && updateDto.SKU.Trim() != product.SKU)
            {
                var existingProduct = await _context.Products
                    .FirstOrDefaultAsync(p => p.SKU == updateDto.SKU.Trim() && p.Id != id);

                if (existingProduct != null)
                {
                    throw new ArgumentException($"A product with SKU '{updateDto.SKU}' already exists.");
                }
            }

            // Update only provided fields
            if (!string.IsNullOrWhiteSpace(updateDto.Name))
            {
                product.Name = updateDto.Name.Trim();
            }

            if (!string.IsNullOrWhiteSpace(updateDto.SKU))
            {
                product.SKU = updateDto.SKU.Trim();
            }

            if (updateDto.Price.HasValue)
            {
                if (updateDto.Price.Value <= 0)
                {
                    throw new ArgumentException("Price must be greater than 0.");
                }
                product.Price = updateDto.Price.Value;
            }

            if (updateDto.Stock.HasValue)
            {
                if (updateDto.Stock.Value < 0)
                {
                    throw new ArgumentException("Stock cannot be negative.");
                }
                product.Stock = updateDto.Stock.Value;
            }

            if (updateDto.IsActive.HasValue)
            {
                product.IsActive = updateDto.IsActive.Value;
            }

            if (updateDto.ImageUrl != null)
            {
                var newImageUrl = string.IsNullOrWhiteSpace(updateDto.ImageUrl) ? null : updateDto.ImageUrl.Trim();
                if (!string.Equals(product.ImageUrl, newImageUrl, StringComparison.Ordinal))
                {
                    _productImageService.DeleteProductImage(product.ImageUrl);
                    product.ImageUrl = newImageUrl;
                }
            }

            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(product);
        }

        /// <summary>
        /// Increment product stock and log ADD_STOCK activity
        /// </summary>
        public async Task<AddStockResultDto> AddStockAsync(AddStockDto addStockDto, Guid? performedByUserId)
        {
            if (addStockDto.Quantity <= 0)
            {
                throw new ArgumentException("Quantity must be at least 1.");
            }

            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == addStockDto.ProductId);

            if (product == null)
            {
                throw new ArgumentException($"Product with ID {addStockDto.ProductId} not found.");
            }

            var previousStock = product.Stock;
            product.Stock += addStockDto.Quantity;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var actorId = performedByUserId ?? addStockDto.PerformedByUserId;
            if (actorId.HasValue)
            {
                var notePart = string.IsNullOrWhiteSpace(addStockDto.Note) ? "" : $" Note: {addStockDto.Note.Trim()}";
                await _userActivityService.LogAsync(
                    actorId.Value,
                    "ADD_STOCK",
                    "Product",
                    product.Id,
                    $"Added {addStockDto.Quantity} to '{product.Name}' (SKU: {product.SKU}). Stock {previousStock} → {product.Stock}.{notePart}");
            }

            return new AddStockResultDto
            {
                ProductId = product.Id,
                ProductName = product.Name,
                PreviousStock = previousStock,
                AddedQuantity = addStockDto.Quantity,
                NewStock = product.Stock
            };
        }

        /// <summary>
        /// Delete a product
        /// </summary>
        public async Task<bool> DeleteProductAsync(Guid id)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return false;
            }

            // Check if product is used in any sales transactions
            var hasTransactionItems = await _context.SalesTransactionItems
                .AnyAsync(sti => sti.ProductId == id);

            var hasSales = await _context.Sales
                .AnyAsync(s => s.ProductId == id);

            if (hasTransactionItems || hasSales)
            {
                throw new InvalidOperationException($"Cannot delete product '{product.Name}' because it is associated with sales transactions.");
            }

            _productImageService.DeleteProductImage(product.ImageUrl);
            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Map entity to DTO
        /// </summary>
        private ProductDto MapToDto(ProductsModelEntity product)
        {
            return new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                SKU = product.SKU,
                Price = product.Price,
                Stock = product.Stock,
                IsActive = product.IsActive,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt,
                ImageUrl = product.ImageUrl
            };
        }
    }
}

