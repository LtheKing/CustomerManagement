using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    [Table("CustomerTraffic")]
    public class CustomerTrafficModelEntity
    {
        [Key]
        public Guid Id { get; set; }
        
        public Guid? CustomerId { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Source { get; set; } = null!;
        
        [MaxLength(100)]
        public string? Campaign { get; set; }
        
        public DateTime VisitDate { get; set; }
        
        [MaxLength(200)]
        public string? Page { get; set; }

        // Navigation properties
        [ForeignKey("CustomerId")]
        public CustomerModelEntity? Customer { get; set; }
    }
}
