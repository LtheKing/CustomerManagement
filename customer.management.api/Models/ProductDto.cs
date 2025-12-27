namespace customer.management.api.Models
{
    /// <summary>
    /// Data Transfer Object for Product response
    /// </summary>
    public class ProductDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string SKU { get; set; } = null!;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}

