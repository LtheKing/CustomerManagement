using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace customer.management.data.entity.Models
{
    // Created via SQL: CREATE TABLE Expenses (...)  -- unquoted => table name is lowercase in PostgreSQL
    [Table("expenses")]
    public class ExpenseModelEntity
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string Description { get; set; } = null!;

        [Required]
        [Column(TypeName = "numeric(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        public DateTimeOffset ExpenseDate { get; set; }
    }
}



