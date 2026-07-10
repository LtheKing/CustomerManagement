namespace customer.management.api.Interfaces
{
    public interface IProductImageService
    {
        Task<string> SaveProductImageAsync(IFormFile file);
        void DeleteProductImage(string? imageUrl);
    }
}
