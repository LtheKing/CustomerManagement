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

        public ProductService(CustomerManagementDbContext context)
        {
            _context = context;
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
                UpdatedAt = product.UpdatedAt
            };
        }
    }
}

