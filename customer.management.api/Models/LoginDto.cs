using System.ComponentModel.DataAnnotations;

namespace customer.management.api.Models
{
    /// <summary>
    /// Data Transfer Object for user login
    /// </summary>
    public class LoginDto
    {
        [Required]
        public string Username { get; set; } = null!;

        [Required]
        public string Password { get; set; } = null!;
    }
}

