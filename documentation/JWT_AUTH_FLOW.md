# JWT Authentication & Authorization Flow
## Complete Guide: From User Registration to Login

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Step 1: User Registration](#step-1-user-registration)
3. [Step 2: Password Security](#step-2-password-security)
4. [Step 3: Login Process](#step-3-login-process)
5. [Step 4: JWT Token Generation](#step-4-jwt-token-generation)
6. [Step 5: Token Storage](#step-5-token-storage)
7. [Step 6: Token Validation](#step-6-token-validation)
8. [Step 7: Authorization](#step-7-authorization)
9. [Step 8: Token Refresh](#step-8-token-refresh)
10. [Step 9: Logout](#step-9-logout)
11. [Security Features](#security-features)

---

## 🎯 Overview

This application uses **JWT (JSON Web Tokens)** for authentication with a **dual-token system**:
- **Access Token**: Short-lived (30 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens

Tokens are stored in **HTTP-only cookies** for security (prevents XSS attacks).

---

## 📝 Step 1: User Registration

### Backend Flow (`UserController.cs` → `UserService.cs`)

**1.1. API Endpoint: `POST /api/user`**
```csharp
[HttpPost]
public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto createDto)
```

**1.2. Validation** (`UserService.CreateUserAsync`)
- ✅ Check required fields (Username, Email, Password, Role)
- ✅ Validate role is one of: `Admin`, `SalesManager`, `SalesRep`
- ✅ Check username uniqueness
- ✅ Check email uniqueness

**1.3. Password Hashing** (Line 99 in `UserService.cs`)
```csharp
var passwordHash = BCrypt.Net.BCrypt.HashPassword(createDto.Password);
```
- Uses **BCrypt** algorithm (one-way hashing)
- Example: `"password123"` → `"$2a$11$KIXQZqJZqJZqJZqJZqJZqO..."` (60+ characters)
- **Never stored in plain text!**

**1.4. User Creation** (Lines 101-109)
```csharp
var user = new UserModelEntity
{
    Id = Guid.NewGuid(),
    Username = createDto.Username.Trim(),
    Email = createDto.Email.Trim(),
    PasswordHash = passwordHash,  // Hashed, not plain text!
    Role = createDto.Role.Trim(),
    CreatedAt = DateTime.UtcNow
};
```

**1.5. Database Storage**
- User saved to `Users` table
- Password hash stored (never the actual password)
- Returns `UserDto` (without password hash)

---

## 🔐 Step 2: Password Security

### Why BCrypt?

1. **One-way hashing**: Cannot reverse to get original password
2. **Salt included**: Each hash is unique (same password = different hash)
3. **Computationally expensive**: Slows down brute-force attacks
4. **Industry standard**: Used by many applications

### Example:
```
Input:  "admin123"
Output: "$2a$11$KIXQZqJZqJZqJZqJZqJZqO..." (unique each time)
```

---

## 🔑 Step 3: Login Process

### Frontend Flow (`Login.tsx`)

**3.1. User Submits Form**
```typescript
const response = await apiService.login(formData);
// formData = { username: "admin", password: "admin123" }
```

**3.2. API Call** (`api.ts`)
```typescript
async login(request: LoginRequest): Promise<LoginResponse> {
  return this.fetchData<LoginResponse>('/user/login', {
    method: 'POST',
    body: JSON.stringify(request),
    credentials: 'include'  // Important: sends cookies
  });
}
```

### Backend Flow (`UserController.cs` → `UserService.cs`)

**3.3. Login Endpoint: `POST /api/user/login`** (Line 160)
```csharp
[HttpPost("login")]
public async Task<ActionResult<LoginResponseDto>> Login(LoginDto loginDto)
```

**3.4. User Lookup** (`UserService.LoginAsync`, Line 224)
```csharp
var user = await _context.Users
    .FirstOrDefaultAsync(u => u.Username == loginDto.Username.Trim());
```

**3.5. Password Verification** (Line 238)
```csharp
var isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);
```
- Compares plain password with stored hash
- Returns `true` if match, `false` otherwise
- **Never compares plain text passwords!**

**3.6. Login Response**
- ✅ **Success**: Returns `UserDto` (user info without password)
- ❌ **Failure**: Returns `"Invalid username or password"` (generic message for security)

---

## 🎫 Step 4: JWT Token Generation

### After Successful Login (`UserController.cs`, Lines 178-179)

**4.1. Generate Access Token**
```csharp
var accessToken = _jwtTokenService.GenerateAccessToken(result.User);
```

**4.2. Generate Refresh Token**
```csharp
var refreshToken = _jwtTokenService.GenerateRefreshToken();
```

### Access Token Structure (`JwtTokenService.cs`, Lines 26-54)

**4.3. Token Claims** (Lines 34-40)
```csharp
var claims = new List<Claim>
{
    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),  // User ID
    new Claim(ClaimTypes.Name, user.Username),                // Username
    new Claim(ClaimTypes.Email, user.Email),                   // Email
    new Claim(ClaimTypes.Role, user.Role)                     // Role (Admin/SalesManager/SalesRep)
};
```

**4.4. Token Configuration** (Lines 42-50)
```csharp
var tokenDescriptor = new SecurityTokenDescriptor
{
    Subject = new ClaimsIdentity(claims),
    Expires = DateTime.UtcNow.AddMinutes(30),  // ⏰ 30 minutes lifetime
    Issuer = "CustomerManagementAPI",
    Audience = "CustomerManagementClient",
    SigningCredentials = new SigningCredentials(
        new SymmetricSecurityKey(key),
        SecurityAlgorithms.HmacSha256Signature)  // 🔐 HMAC SHA256
};
```

**4.5. Token Generation**
- Uses **HMAC SHA256** algorithm
- Signed with secret key from `Jwt:Key` configuration
- Contains user identity and role information
- Expires in 30 minutes

### Refresh Token Structure (Lines 57-63)

**4.6. Random Token Generation**
```csharp
public string GenerateRefreshToken()
{
    var randomNumber = new byte[64];
    using var rng = RandomNumberGenerator.Create();
    rng.GetBytes(randomNumber);
    return Convert.ToBase64String(randomNumber);  // Random 64-byte token
}
```
- **Random 64-byte** value
- **Base64 encoded**
- **No expiration in token itself** (stored in database with expiration)

---

## 🍪 Step 5: Token Storage

### HTTP-Only Cookies (`UserController.cs`, Lines 185-203)

**5.1. Access Token Cookie** (Lines 185-193)
```csharp
var cookieOptions = new CookieOptions
{
    HttpOnly = true,              // 🔒 Cannot be accessed by JavaScript (prevents XSS)
    Secure = Request.IsHttps,     // 🔒 Only sent over HTTPS in production
    SameSite = SameSiteMode.None, // 🌐 Required for cross-origin requests
    Expires = DateTimeOffset.UtcNow.AddMinutes(30)  // ⏰ 30 minutes
};

Response.Cookies.Append("accessToken", accessToken, cookieOptions);
```

**5.2. Refresh Token Cookie** (Lines 195-203)
```csharp
var refreshCookieOptions = new CookieOptions
{
    HttpOnly = true,
    Secure = Request.IsHttps,
    SameSite = SameSiteMode.None,
    Expires = DateTimeOffset.UtcNow.AddDays(7)  // ⏰ 7 days
};

Response.Cookies.Append("refreshToken", refreshToken, refreshCookieOptions);
```

**5.3. Refresh Token Database Storage** (Line 182, `UserService.SaveRefreshTokenAsync`)
```csharp
var tokenEntity = new RefreshTokenModelEntity
{
    UserId = userId,
    Token = refreshToken,
    ExpiresAt = DateTime.UtcNow.AddDays(7),
    CreatedAt = DateTime.UtcNow,
    IsRevoked = false
};
_context.RefreshTokens.Add(tokenEntity);
```
- Stored in `RefreshTokens` table
- Linked to user via `UserId`
- Can be revoked (for logout/security)

**5.4. Frontend Storage** (`Login.tsx`, Lines 36-37)
```typescript
localStorage.setItem("user", JSON.stringify(response.user));  // User info only
localStorage.setItem("isAuthenticated", "true");              // Auth flag
```
- **Tokens are NOT in localStorage** (security!)
- Only user info and auth flag stored
- Tokens automatically sent via cookies on each request

---

## ✅ Step 6: Token Validation

### JWT Configuration (`Program.cs`, Lines 188-223)

**6.1. JWT Bearer Authentication Setup**
```csharp
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,     // ✅ Verify signature
            IssuerSigningKey = signingKey,       // 🔑 Secret key
            ValidateIssuer = true,               // ✅ Verify issuer
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,             // ✅ Verify audience
            ValidAudience = jwtAudience,
            ValidateLifetime = true,             // ✅ Check expiration
            ClockSkew = TimeSpan.Zero            // ⏰ No time tolerance
        };
        
        // Extract token from cookie if not in Authorization header
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (string.IsNullOrEmpty(context.Token))
                {
                    context.Token = context.Request.Cookies["accessToken"];  // 🍪 Get from cookie
                }
                return Task.CompletedTask;
            }
        };
    });
```

**6.2. Automatic Validation**
- Every request with `[Authorize]` attribute triggers validation
- ASP.NET Core middleware validates:
  - ✅ Token signature (not tampered)
  - ✅ Token expiration (not expired)
  - ✅ Issuer and Audience (correct source)
  - ✅ Claims extraction (user ID, role, etc.)

**6.3. Protected Route Check** (`App.tsx`, Lines 10-49)
```typescript
const ProtectedRoute = ({ children }) => {
  useEffect(() => {
    const checkAuth = async () => {
      // Check localStorage first (quick check)
      const hasLocalAuth = localStorage.getItem("isAuthenticated") === "true";
      if (!hasLocalAuth) {
        setIsAuthenticated(false);
        return;
      }

      // Verify token is still valid by calling /user/me
      const response = await fetch(`${API_BASE_URL}/user/me`, {
        method: 'GET',
        credentials: 'include',  // Sends accessToken cookie
      });

      if (response.ok) {
        setIsAuthenticated(true);  // Token valid
      } else {
        // Token invalid, clear stale data
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);
};
```

**6.4. Get Current User Endpoint** (`UserController.cs`, Lines 36-63)
```csharp
[HttpGet("me")]
[Authorize]  // 🔒 Requires valid JWT token
public async Task<ActionResult<UserDto>> GetCurrentUser()
{
    // Get user ID from JWT claims (extracted from token)
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
    var userId = Guid.Parse(userIdClaim.Value);
    
    // Return user info
    var result = await _userService.GetUserByIdAsync(userId);
    return Ok(result);
}
```

---

## 🛡️ Step 7: Authorization

### Role-Based Access Control (RBAC)

**7.1. Authorization Policies** (`Program.cs`, Lines 229-233)
```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("SalesManagerOrAdmin", policy => 
        policy.RequireRole("Admin", "SalesManager"));
});
```

**7.2. Controller-Level Authorization** (`UserController.cs`)
```csharp
[HttpGet]
[Authorize(Roles = "Admin,SalesManager")]  // Only Admin or SalesManager
public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()

[HttpPost]
[Authorize(Roles = "Admin")]  // Only Admin
public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto createDto)
```

**7.3. How It Works**
1. JWT token contains `Role` claim (from Step 4.3)
2. `[Authorize(Roles = "Admin")]` checks if user's role matches
3. If role doesn't match → **403 Forbidden**
4. If token invalid/expired → **401 Unauthorized**

**7.4. Frontend Authorization** (`utils/auth.ts`)
```typescript
export const isAdmin = (): boolean => {
  return hasRole(["Admin"]);
};

export const isSales = (): boolean => {
  return hasRole(["SalesManager", "SalesRep"]);
};
```
- Checks user role from localStorage
- Used to show/hide UI elements
- **Note**: Backend validation is the source of truth!

---

## 🔄 Step 8: Token Refresh

### Automatic Token Refresh (`api.ts`, Lines 28-66)

**8.1. API Request with 401 Response**
```typescript
private async fetchData<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',  // Sends accessToken cookie
  });
  
  // Handle 401 Unauthorized - token expired
  if (response.status === 401 && endpoint !== '/user/login' && endpoint !== '/user/refresh') {
    await this.refreshAccessToken();  // 🔄 Try to refresh
    return this.fetchData<T>(endpoint, options);  // Retry original request
  }
}
```

**8.2. Refresh Token Endpoint** (`UserController.cs`, Lines 218-264)
```csharp
[HttpPost("refresh")]
public async Task<IActionResult> RefreshToken()
{
    // Get refresh token from cookie
    var refreshToken = Request.Cookies["refreshToken"];
    
    // Validate refresh token in database
    var userId = await _userService.ValidateRefreshTokenAsync(refreshToken);
    if (userId == null) {
        return Unauthorized(new { error = "Invalid or expired refresh token" });
    }
    
    // Get user and generate NEW access token
    var user = await _userService.GetUserByIdAsync(userId.Value);
    var newAccessToken = _jwtTokenService.GenerateAccessToken(user);
    
    // Set new access token cookie (30 minutes)
    Response.Cookies.Append("accessToken", newAccessToken, cookieOptions);
    
    return Ok(new { message = "Token refreshed successfully" });
}
```

**8.3. Refresh Token Validation** (`UserService.cs`, Lines 261-272)
```csharp
public async Task<Guid?> ValidateRefreshTokenAsync(string refreshToken)
{
    var token = await _context.RefreshTokens
        .FirstOrDefaultAsync(rt => 
            rt.Token == refreshToken && 
            !rt.IsRevoked &&           // ✅ Not revoked
            rt.ExpiresAt > DateTime.UtcNow  // ✅ Not expired
        );
    
    if (token == null) return null;  // Invalid/expired
    
    return token.UserId;  // Return user ID
}
```

**8.4. Flow Diagram**
```
1. User makes API request
   ↓
2. Access token expired (401)
   ↓
3. Frontend calls /user/refresh
   ↓
4. Backend validates refresh token
   ↓
5. Backend generates new access token
   ↓
6. New access token sent in cookie
   ↓
7. Original request retried with new token
   ↓
8. Request succeeds ✅
```

---

## 🚪 Step 9: Logout

### Logout Process (`UserController.cs`, Lines 266-298)

**9.1. Logout Endpoint: `POST /api/user/logout`**
```csharp
[HttpPost("logout")]
public async Task<IActionResult> Logout()
{
    // Get refresh token from cookie
    var refreshToken = Request.Cookies["refreshToken"];
    
    // Revoke refresh token in database
    if (!string.IsNullOrEmpty(refreshToken))
    {
        await _userService.RevokeRefreshTokenAsync(refreshToken);
    }
    
    // Clear cookies
    Response.Cookies.Delete("accessToken");
    Response.Cookies.Delete("refreshToken");
    
    return Ok(new { message = "Logout successful" });
}
```

**9.2. Refresh Token Revocation** (`UserService.cs`, Lines 295-306)
```csharp
public async Task RevokeRefreshTokenAsync(string refreshToken)
{
    var token = await _context.RefreshTokens
        .FirstOrDefaultAsync(rt => rt.Token == refreshToken);
    
    if (token != null)
    {
        token.IsRevoked = true;      // Mark as revoked
        token.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }
}
```

**9.3. Frontend Logout** (`Dashboard.tsx`, Lines 308-323)
```typescript
const handleLogout = async () => {
  try {
    await apiService.logout();  // Call logout API
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Clear authentication data
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    
    // Redirect to login
    window.location.href = "/login";
  }
};
```

**9.4. What Happens**
1. ✅ Refresh token marked as revoked in database
2. ✅ Access token cookie deleted
3. ✅ Refresh token cookie deleted
4. ✅ LocalStorage cleared
5. ✅ User redirected to login page
6. ✅ Cannot use old tokens (revoked in DB)

---

## 🔒 Security Features

### 1. **HTTP-Only Cookies**
- ✅ Tokens cannot be accessed by JavaScript
- ✅ Prevents XSS (Cross-Site Scripting) attacks
- ✅ Automatically sent with requests

### 2. **Password Hashing**
- ✅ BCrypt one-way hashing
- ✅ Salt included automatically
- ✅ Never stored in plain text

### 3. **Short-Lived Access Tokens**
- ✅ 30-minute expiration
- ✅ Limits damage if token is stolen
- ✅ Automatic refresh mechanism

### 4. **Refresh Token Revocation**
- ✅ Can revoke refresh tokens
- ✅ Stored in database with expiration
- ✅ Checked on every refresh request

### 5. **JWT Signature Validation**
- ✅ Tokens signed with secret key
- ✅ Cannot be tampered with
- ✅ Validated on every request

### 6. **Role-Based Authorization**
- ✅ Backend validates roles
- ✅ Frontend UI can be bypassed
- ✅ Always check on server

### 7. **CORS Protection**
- ✅ Configured for specific origins
- ✅ Credentials required for cookies
- ✅ Prevents unauthorized domains

### 8. **Secure Cookie Settings**
- ✅ `HttpOnly: true` (no JS access)
- ✅ `Secure: true` (HTTPS only in production)
- ✅ `SameSite: None` (cross-origin support)

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION                         │
└─────────────────────────────────────────────────────────────┘
         │
         ├─> POST /api/user
         │   ├─> Validate input
         │   ├─> Check uniqueness
         │   ├─> Hash password (BCrypt)
         │   └─> Save to database
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      USER LOGIN                              │
└─────────────────────────────────────────────────────────────┘
         │
         ├─> POST /api/user/login
         │   ├─> Find user by username
         │   ├─> Verify password (BCrypt.Verify)
         │   ├─> Generate Access Token (JWT, 30 min)
         │   ├─> Generate Refresh Token (random, 7 days)
         │   ├─> Save refresh token to database
         │   ├─> Set accessToken cookie (HTTP-only)
         │   └─> Set refreshToken cookie (HTTP-only)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  PROTECTED API REQUEST                      │
└─────────────────────────────────────────────────────────────┘
         │
         ├─> Request with [Authorize]
         │   ├─> Extract token from cookie
         │   ├─> Validate signature
         │   ├─> Check expiration
         │   ├─> Extract claims (ID, Role, etc.)
         │   └─> Allow/Deny request
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  TOKEN EXPIRED (401)                         │
└─────────────────────────────────────────────────────────────┘
         │
         ├─> POST /user/refresh
         │   ├─> Get refresh token from cookie
         │   ├─> Validate in database
         │   ├─> Check not revoked/expired
         │   ├─> Generate new access token
         │   └─> Set new accessToken cookie
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      USER LOGOUT                             │
└─────────────────────────────────────────────────────────────┘
         │
         ├─> POST /api/user/logout
         │   ├─> Revoke refresh token in database
         │   ├─> Delete accessToken cookie
         │   └─> Delete refreshToken cookie
         │
         ▼
         [User logged out, tokens invalid]
```

---

## 🎓 Key Takeaways

1. **Passwords are NEVER stored in plain text** - Always hashed with BCrypt
2. **Tokens are in HTTP-only cookies** - Not accessible to JavaScript
3. **Access tokens are short-lived** - 30 minutes, auto-refreshed
4. **Refresh tokens are long-lived** - 7 days, stored in database
5. **Backend validates everything** - Frontend checks are for UX only
6. **Roles come from JWT claims** - Extracted automatically by ASP.NET Core
7. **Tokens can be revoked** - Refresh tokens marked as revoked in database

---

## 🔍 Code References

- **User Registration**: `UserService.CreateUserAsync()` (Lines 50-115)
- **Login**: `UserService.LoginAsync()` (Lines 221-256)
- **JWT Generation**: `JwtTokenService.GenerateAccessToken()` (Lines 26-54)
- **Token Validation**: `Program.cs` JWT Bearer configuration (Lines 188-223)
- **Authorization**: `UserController.cs` with `[Authorize]` attributes
- **Token Refresh**: `UserController.RefreshToken()` (Lines 218-264)
- **Logout**: `UserController.Logout()` (Lines 266-298)

---

**Last Updated**: Based on current codebase implementation

