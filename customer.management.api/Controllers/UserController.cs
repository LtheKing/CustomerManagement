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

        // SameSite=None requires Secure=true; Fly terminates TLS at the edge so Request.IsHttps can be false without forwarded headers
        private static CookieOptions CreateAuthCookieOptions(DateTimeOffset expires) => new()
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = expires
        };

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
                // Get user ID from JWT claims (support mapped + unmapped claim types)
                var userIdClaim =
                    User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                    ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirst("sub")
                    ?? User.FindFirst("nameid");

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

                Response.Cookies.Append("accessToken", accessToken,
                    CreateAuthCookieOptions(DateTimeOffset.UtcNow.AddMinutes(30)));

                Response.Cookies.Append("refreshToken", refreshToken,
                    CreateAuthCookieOptions(DateTimeOffset.UtcNow.AddDays(7)));

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

                Response.Cookies.Append("accessToken", newAccessToken,
                    CreateAuthCookieOptions(DateTimeOffset.UtcNow.AddMinutes(30)));

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

                Response.Cookies.Delete("accessToken", CreateAuthCookieOptions(DateTimeOffset.UtcNow.AddDays(-1)));
                Response.Cookies.Delete("refreshToken", CreateAuthCookieOptions(DateTimeOffset.UtcNow.AddDays(-1)));

                return Ok(new { message = "Logout successful" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred during logout", details = ex.Message });
            }
        }
    }
}

