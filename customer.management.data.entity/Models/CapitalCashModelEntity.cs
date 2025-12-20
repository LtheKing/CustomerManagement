using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    // Created via SQL: CREATE TABLE CapitalCash (...)  -- unquoted => table name is lowercase in PostgreSQL
    [Table("capitalcash")]
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



