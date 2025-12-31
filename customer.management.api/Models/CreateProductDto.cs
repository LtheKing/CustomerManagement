using System.ComponentModel.DataAnnotations;

namespace customer.management.api.Models
{
    /// <summary>
    /// Data Transfer Object for creating or updating a Product
    /// For create: Name, SKU, and Price are required
    /// For update: All fields are optional
    /// </summary>
    public class CreateProductDto
    {
        [MaxLength(100)]
        public string? Name { get; set; }

        [MaxLength(50)]
        public string? SKU { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
        public decimal? Price { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Stock cannot be negative")]
        public int? Stock { get; set; }

        public bool? IsActive { get; set; }
    }
}

