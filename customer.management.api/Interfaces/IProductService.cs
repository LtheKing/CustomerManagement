using customer.management.api.Models;

namespace customer.management.api.Interfaces
{
    public interface IProductService
    {
        Task<IEnumerable<ProductDto>> GetAllProductsAsync();
        Task<ProductDto?> GetProductByIdAsync(Guid id);
        Task<IEnumerable<ProductDto>> GetActiveProductsAsync();
        Task<ProductDto> CreateProductAsync(CreateProductDto createDto);
        Task<ProductDto> UpdateProductAsync(Guid id, CreateProductDto updateDto);
        Task<AddStockResultDto> AddStockAsync(AddStockDto addStockDto, Guid? performedByUserId);
        Task<bool> DeleteProductAsync(Guid id);
    }
}

