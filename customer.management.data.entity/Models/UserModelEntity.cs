using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    [Table("Users")]
    public class UserModelEntity
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = null!;
        
        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = null!;
        
        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = null!;
        
        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = null!;
        
        public DateTime CreatedAt { get; set; }
    }
}
