using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    [Table("Customers")]
    public class CustomerModelEntity
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = null!;
        
        [MaxLength(100)]
        public string? Email { get; set; }
        
        [MaxLength(20)]
        public string? Phone { get; set; }
        
        [MaxLength(255)]
        public string? Address { get; set; }
        
        [MaxLength(100)]
        public string? Company { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        [Required]
        public Guid CreatedBy { get; set; }

        // Navigation properties
        [ForeignKey("CreatedBy")]
        public UserModelEntity User { get; set; } = null!;

        public ICollection<SalesModelEntity> Sales { get; set; } = new List<SalesModelEntity>();
        public ICollection<CustomerTrafficModelEntity> Traffic { get; set; } = new List<CustomerTrafficModelEntity>();
    }
}
