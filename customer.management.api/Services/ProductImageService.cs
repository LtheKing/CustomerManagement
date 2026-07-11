using customer.management.api.Interfaces;

namespace customer.management.api.Services
{
    public class ProductImageService : IProductImageService
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp"
        };

        private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/webp"
        };

        private const long MaxFileSizeBytes = 2 * 1024 * 1024; // 2 MB

        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<ProductImageService> _logger;

        public ProductImageService(IWebHostEnvironment environment, ILogger<ProductImageService> logger)
        {
            _environment = environment;
            _logger = logger;
        }

        public async Task<string> SaveProductImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("No image file provided.");
            }

            if (file.Length > MaxFileSizeBytes)
            {
                throw new ArgumentException("Image must be 2 MB or smaller.");
            }

            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
            {
                throw new ArgumentException("Only JPG, PNG, and WebP images are allowed.");
            }

            if (!string.IsNullOrWhiteSpace(file.ContentType) && !AllowedContentTypes.Contains(file.ContentType))
            {
                throw new ArgumentException("Invalid image file type.");
            }

            var uploadsDirectory = GetUploadsDirectory();
            Directory.CreateDirectory(uploadsDirectory);

            var fileName = $"{Guid.NewGuid()}{extension.ToLowerInvariant()}";
            var filePath = Path.Combine(uploadsDirectory, fileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            return $"/uploads/products/{fileName}";
        }

        public void DeleteProductImage(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                return;
            }

            try
            {
                var relativePath = imageUrl.TrimStart('/');
                if (!relativePath.StartsWith("uploads/products/", StringComparison.OrdinalIgnoreCase))
                {
                    return;
                }

                var fileName = Path.GetFileName(relativePath);
                if (string.IsNullOrWhiteSpace(fileName))
                {
                    return;
                }

                var filePath = Path.Combine(GetUploadsDirectory(), fileName);
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete product image at {ImageUrl}", imageUrl);
            }
        }

        private string GetUploadsDirectory()
        {
            return Path.Combine(_environment.WebRootPath, "uploads", "products");
        }
    }
}
