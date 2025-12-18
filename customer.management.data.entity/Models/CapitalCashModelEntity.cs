using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    // Created via SQL: CREATE TABLE CapitalCash (...)  -- unquoted => table name is lowercase in PostgreSQL
    [Table("capitalcash")]
    public class CapitalCashModelEntity
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("balance", TypeName = "numeric(18,2)")]
        public decimal Balance { get; set; }

        [Required]
        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; }
    }
}



