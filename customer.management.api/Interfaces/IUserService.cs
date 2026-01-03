using customer.management.api.Models;

namespace customer.management.api.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
        Task<UserDto?> GetUserByIdAsync(Guid id);
        Task<UserDto> CreateUserAsync(CreateUserDto createDto);
        Task<UserDto> UpdateUserAsync(Guid id, CreateUserDto updateDto);
        Task<bool> DeleteUserAsync(Guid id);
        Task<LoginResponseDto> LoginAsync(LoginDto loginDto);
        Task<Guid?> ValidateRefreshTokenAsync(string refreshToken);
        Task SaveRefreshTokenAsync(Guid userId, string refreshToken);
        Task RevokeRefreshTokenAsync(string refreshToken);
    }
}

