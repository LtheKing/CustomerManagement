using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    // Table name must match exactly what's in the database
    // If table is "CapitalCash" (PascalCase, quoted), use [Table("CapitalCash")]
    // If table is "capitalcash" (lowercase, unquoted), use [Table("capitalcash")]
    [Table("CapitalCash")]
    public class CapitalCashModelEntity
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [Column(TypeName = "numeric(18,2)")]
        public decimal Balance { get; set; }

        [Required]
        public DateTimeOffset UpdatedAt { get; set; }
    }
}



