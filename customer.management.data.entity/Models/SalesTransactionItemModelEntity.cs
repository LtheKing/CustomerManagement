using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    [Table("SalesTransactionItems")]
    public class SalesTransactionItemModelEntity
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid TransactionId { get; set; }
        
        [Required]
        public Guid ProductId { get; set; }
        
        [Required]
        public int Quantity { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; }

        // Navigation properties
        [ForeignKey("TransactionId")]
        public SalesModelEntity Transaction { get; set; } = null!;
        
        [ForeignKey("ProductId")]
        public ProductsModelEntity Product { get; set; } = null!;
    }
}
