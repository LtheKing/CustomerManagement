using Microsoft.AspNetCore.Mvc;
using customer.management.api.Interfaces;
using customer.management.api.Models;
using customer.management.api.Services;

namespace customer.management.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IJwtTokenService _jwtTokenService;

        public UserController(IUserService userService, IJwtTokenService jwtTokenService)
        {
            _userService = userService;
            _jwtTokenService = jwtTokenService;
        }

        // GET: api/user
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            try
            {
                var result = await _userService.GetAllUsersAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while retrieving users", details = ex.Message });
            }
        }

        // GET: api/user/me
        [HttpGet("me")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            try
            {
                // Get user ID from JWT claims
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { error = "Invalid token" });
                }

                var result = await _userService.GetUserByIdAsync(userId);

                if (result == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while retrieving the user", details = ex.Message });
            }
        }

        // GET: api/user/5
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(Guid id)
        {
            try
            {
                var result = await _userService.GetUserByIdAsync(id);

                if (result == null)
                {
                    return NotFound(new { error = $"User with ID {id} not found" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while retrieving the user", details = ex.Message });
            }
        }

        // POST: api/user
        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _userService.CreateUserAsync(createDto);
                return CreatedAtAction(nameof(GetUser), new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while creating the user", details = ex.Message });
            }
        }

        // PUT: api/user/5
        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateUser(Guid id, CreateUserDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _userService.UpdateUserAsync(id, updateDto);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while updating the user", details = ex.Message });
            }
        }

        // DELETE: api/user/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            try
            {
                var deleted = await _userService.DeleteUserAsync(id);

                if (!deleted)
                {
                    return NotFound(new { error = $"User with ID {id} not found" });
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while deleting the user", details = ex.Message });
            }
        }

        // POST: api/user/login
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login(LoginDto loginDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _userService.LoginAsync(loginDto);

                if (!result.Success || result.User == null)
                {
                    return Unauthorized(new { error = result.Message });
                }

                // Generate tokens
                var accessToken = _jwtTokenService.GenerateAccessToken(result.User);
                var refreshToken = _jwtTokenService.GenerateRefreshToken();

                // Save refresh token to database
                await _userService.SaveRefreshTokenAsync(result.User.Id, refreshToken);

                // Set HTTP-only cookies
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = Request.IsHttps, // Use HTTPS in production
                    SameSite = SameSiteMode.None, // Required for cross-origin
                    Expires = DateTimeOffset.UtcNow.AddMinutes(30) // Short-lived access token
                };

                Response.Cookies.Append("accessToken", accessToken, cookieOptions);

                var refreshCookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = Request.IsHttps,
                    SameSite = SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddDays(7) // Long-lived refresh token
                };

                Response.Cookies.Append("refreshToken", refreshToken, refreshCookieOptions);

                // Return user info only (tokens are in cookies)
                return Ok(new { 
                    success = true, 
                    message = result.Message,
                    user = result.User 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred during login", details = ex.Message });
            }
        }

        // POST: api/user/refresh
        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken()
        {
            try
            {
                var refreshToken = Request.Cookies["refreshToken"];

                if (string.IsNullOrEmpty(refreshToken))
                {
                    return Unauthorized(new { error = "Refresh token not found" });
                }

                // Validate refresh token
                var userId = await _userService.ValidateRefreshTokenAsync(refreshToken);
                if (userId == null)
                {
                    return Unauthorized(new { error = "Invalid or expired refresh token" });
                }

                // Get user and generate new access token
                var user = await _userService.GetUserByIdAsync(userId.Value);
                if (user == null)
                {
                    return Unauthorized(new { error = "User not found" });
                }

                var newAccessToken = _jwtTokenService.GenerateAccessToken(user);

                // Set new access token cookie
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = Request.IsHttps,
                    SameSite = SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddMinutes(30)
                };

                Response.Cookies.Append("accessToken", newAccessToken, cookieOptions);

                return Ok(new { message = "Token refreshed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred during token refresh", details = ex.Message });
            }
        }

        // POST: api/user/logout
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var refreshToken = Request.Cookies["refreshToken"];

                // Revoke refresh token in database
                if (!string.IsNullOrEmpty(refreshToken))
                {
                    await _userService.RevokeRefreshTokenAsync(refreshToken);
                }

                // Clear cookies
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = Request.IsHttps,
                    SameSite = SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddDays(-1) // Expire immediately
                };

                Response.Cookies.Delete("accessToken");
                Response.Cookies.Delete("refreshToken");

                return Ok(new { message = "Logout successful" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred during logout", details = ex.Message });
            }
        }
    }
}

