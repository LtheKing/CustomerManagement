using Microsoft.EntityFrameworkCore;
using customer.management.data.entity.DbContext;
using customer.management.data.entity.Models;
using customer.management.api.Interfaces;
using customer.management.api.Models;
using BCrypt.Net;

namespace customer.management.api.Services
{
    public class UserService : IUserService
    {
        private readonly CustomerManagementDbContext _context;

        public UserService(CustomerManagementDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all users
        /// </summary>
        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            var users = await _context.Users
                .OrderBy(u => u.Username)
                .ToListAsync();

            return users.Select(u => MapToDto(u));
        }

        /// <summary>
        /// Get user by ID
        /// </summary>
        public async Task<UserDto?> GetUserByIdAsync(Guid id)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return null;
            }

            return MapToDto(user);
        }

        /// <summary>
        /// Create a new user
        /// </summary>
        public async Task<UserDto> CreateUserAsync(CreateUserDto createDto)
        {
            // Validate required fields for create
            if (string.IsNullOrWhiteSpace(createDto.Username))
            {
                throw new ArgumentException("Username is required.");
            }

            if (string.IsNullOrWhiteSpace(createDto.Email))
            {
                throw new ArgumentException("Email is required.");
            }

            if (string.IsNullOrWhiteSpace(createDto.Password))
            {
                throw new ArgumentException("Password is required.");
            }

            if (string.IsNullOrWhiteSpace(createDto.Role))
            {
                throw new ArgumentException("Role is required.");
            }

            // Validate role
            var validRoles = new[] { "Admin", "SalesManager", "SalesRep" };
            if (!validRoles.Contains(createDto.Role))
            {
                throw new ArgumentException($"Role must be one of: {string.Join(", ", validRoles)}");
            }

            // Check if username already exists
            var existingUserByUsername = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == createDto.Username.Trim());

            if (existingUserByUsername != null)
            {
                throw new ArgumentException($"A user with username '{createDto.Username}' already exists.");
            }

            // Check if email already exists
            var existingUserByEmail = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == createDto.Email.Trim());

            if (existingUserByEmail != null)
            {
                throw new ArgumentException($"A user with email '{createDto.Email}' already exists.");
            }

            // Hash password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(createDto.Password);

            var user = new UserModelEntity
            {
                Id = Guid.NewGuid(),
                Username = createDto.Username.Trim(),
                Email = createDto.Email.Trim(),
                PasswordHash = passwordHash,
                Role = createDto.Role.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return MapToDto(user);
        }

        /// <summary>
        /// Update an existing user
        /// </summary>
        public async Task<UserDto> UpdateUserAsync(Guid id, CreateUserDto updateDto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                throw new ArgumentException($"User with ID {id} not found.");
            }

            // Check if username is being updated and if it already exists
            if (!string.IsNullOrWhiteSpace(updateDto.Username) && updateDto.Username.Trim() != user.Username)
            {
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == updateDto.Username.Trim() && u.Id != id);

                if (existingUser != null)
                {
                    throw new ArgumentException($"A user with username '{updateDto.Username}' already exists.");
                }
            }

            // Check if email is being updated and if it already exists
            if (!string.IsNullOrWhiteSpace(updateDto.Email) && updateDto.Email.Trim() != user.Email)
            {
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == updateDto.Email.Trim() && u.Id != id);

                if (existingUser != null)
                {
                    throw new ArgumentException($"A user with email '{updateDto.Email}' already exists.");
                }
            }

            // Update only provided fields
            if (!string.IsNullOrWhiteSpace(updateDto.Username))
            {
                user.Username = updateDto.Username.Trim();
            }

            if (!string.IsNullOrWhiteSpace(updateDto.Email))
            {
                user.Email = updateDto.Email.Trim();
            }

            if (!string.IsNullOrWhiteSpace(updateDto.Password))
            {
                // Hash new password
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(updateDto.Password);
            }

            if (!string.IsNullOrWhiteSpace(updateDto.Role))
            {
                // Validate role
                var validRoles = new[] { "Admin", "SalesManager", "SalesRep" };
                if (!validRoles.Contains(updateDto.Role))
                {
                    throw new ArgumentException($"Role must be one of: {string.Join(", ", validRoles)}");
                }
                user.Role = updateDto.Role.Trim();
            }

            await _context.SaveChangesAsync();

            return MapToDto(user);
        }

        /// <summary>
        /// Delete a user
        /// </summary>
        public async Task<bool> DeleteUserAsync(Guid id)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return false;
            }

            // Check if user is referenced by customers or sales
            var hasCustomers = await _context.Customers
                .AnyAsync(c => c.CreatedBy == id);

            var hasSales = await _context.Sales
                .AnyAsync(s => s.CreatedBy == id);

            if (hasCustomers || hasSales)
            {
                throw new InvalidOperationException($"Cannot delete user '{user.Username}' because they are associated with customers or sales records.");
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Login user
        /// </summary>
        public async Task<LoginResponseDto> LoginAsync(LoginDto loginDto)
        {
            // Find user by username
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == loginDto.Username.Trim());

            if (user == null)
            {
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "Invalid username or password.",
                    User = null
                };
            }

            // Verify password
            var isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);

            if (!isPasswordValid)
            {
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "Invalid username or password.",
                    User = null
                };
            }

            return new LoginResponseDto
            {
                Success = true,
                Message = "Login successful.",
                User = MapToDto(user)
            };
        }

        /// <summary>
        /// Validate refresh token and return user ID if valid
        /// </summary>
        public async Task<Guid?> ValidateRefreshTokenAsync(string refreshToken)
        {
            var token = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.IsRevoked);

            if (token == null || token.ExpiresAt < DateTime.UtcNow)
            {
                return null;
            }

            return token.UserId;
        }

        /// <summary>
        /// Save refresh token to database
        /// </summary>
        public async Task SaveRefreshTokenAsync(Guid userId, string refreshToken)
        {
            var tokenEntity = new RefreshTokenModelEntity
            {
                UserId = userId,
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7), // 7 days expiration
                CreatedAt = DateTime.UtcNow,
                IsRevoked = false
            };

            _context.RefreshTokens.Add(tokenEntity);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Revoke refresh token
        /// </summary>
        public async Task RevokeRefreshTokenAsync(string refreshToken)
        {
            var token = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (token != null)
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Map entity to DTO
        /// </summary>
        private UserDto MapToDto(UserModelEntity user)
        {
            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };
        }
    }
}

