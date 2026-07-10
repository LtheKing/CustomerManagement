using System.ComponentModel.DataAnnotations;

namespace customer.management.api.Models
{
    /// <summary>
    /// Data Transfer Object for creating or updating a User
    /// For create: Username, Email, Password, and Role are required
    /// For update: All fields are optional
    /// </summary>
    public class CreateUserDto
    {
        [MaxLength(50)]
        public string? Username { get; set; }

        [MaxLength(100)]
        [EmailAddress]
        public string? Email { get; set; }

        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long")]
        public string? Password { get; set; }

        [MaxLength(50)]
        public string? Role { get; set; }
    }
}

