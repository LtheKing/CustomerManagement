using customer.management.api.Models;

namespace customer.management.api.Interfaces
{
    public interface IProductService
    {
        Task<IEnumerable<ProductDto>> GetAllProductsAsync();
        Task<ProductDto?> GetProductByIdAsync(Guid id);
        Task<IEnumerable<ProductDto>> GetActiveProductsAsync();
    }
}

