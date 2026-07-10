namespace customer.management.api.Models
{
    /// <summary>
    /// Data Transfer Object for login response
    /// </summary>
    public class LoginResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = null!;
        public UserDto? User { get; set; }
    }
}

