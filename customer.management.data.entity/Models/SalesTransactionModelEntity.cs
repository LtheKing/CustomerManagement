using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    [Table("Sales")]
    public class SalesModelEntity
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid CustomerId { get; set; }
        
        [Required]
        public Guid ProductId { get; set; }
        
        public int Quantity { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public string? CashierName { get; set; }
        
        public DateTime SaleDate { get; set; }
        
        [Required]
        public Guid CreatedBy { get; set; }

        // Navigation properties
        [ForeignKey("CustomerId")]
        public CustomerModelEntity Customer { get; set; } = null!;
        
        [ForeignKey("ProductId")]
        public ProductsModelEntity Product { get; set; } = null!;
        
        [ForeignKey("CreatedBy")]
        public UserModelEntity User { get; set; } = null!;
        
        // Transaction items (for multi-item transactions)
        public ICollection<SalesTransactionItemModelEntity> Items { get; set; } = new List<SalesTransactionItemModelEntity>();
    }
}
