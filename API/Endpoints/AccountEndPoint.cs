using System;
using API.Common;
using API.DTOs;
using API.Extensions;
using API.Models;
using API.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints;

public static class AccountEndPoint
{
    private const string AccessTokenCookieName = "access_token";

    public static RouteGroupBuilder MapAccountEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/account").WithTags("account");

        group.MapPost("/register", async (HttpContext httpContext, UserManager<AppUser> userManager,
        [FromForm] string FullName, [FromForm] string Email, [FromForm] string password, [FromForm] string username,
        [FromForm] IFormFile profileImage) =>
        {
            var userFromDb = await userManager.FindByEmailAsync(Email);
            if (userFromDb is not null)
            {
                return Results.BadRequest(Response<string>.Failure("User is already exist."));
            }

            if (profileImage is null)
            {
                return Results.BadRequest(Response<string>.Failure("Profile image is required."));
            }

            if (!FileUpload.IsImageAttachment(profileImage)) return Results.BadRequest(Response<string>.Failure("Profile image must be an image file."));

            await using var imageStream = profileImage.OpenReadStream();
            using var memoryStream = new MemoryStream();
            await imageStream.CopyToAsync(memoryStream);

            var imageBytes = memoryStream.ToArray();
            var imageBase64 = Convert.ToBase64String(imageBytes);
            var picture = $"data:{profileImage.ContentType};base64,{imageBase64}";

            var user = new AppUser
            {
                FullName = FullName,
                Email = Email,
                UserName = username,
                ProfileImage = picture
            };
            var result = await userManager.CreateAsync(user, password);


            if (!result.Succeeded)
            {
                return Results.BadRequest(Response<string>
                .Failure(result.Errors.Select(x => x.Description).FirstOrDefault() ?? "Failed to create user."));
            }

            return Results.Ok(Response<string>.Success("", "User created successfully."));
        }).DisableAntiforgery();

        group.MapPost("/login", async (HttpContext httpContext, UserManager<AppUser> userManager, TokenService tokenService, LoginDto loginDto) =>
        {
            if (loginDto is null)
            {
                return Results.BadRequest(Response<string>.Failure("Invalid login request."));
            }
            var user = await userManager.FindByEmailAsync(loginDto.Email);
            if (user is null)
            {
                return Results.BadRequest(Response<string>.Failure("User not found."));
            }
            var isPasswordValid = await userManager.CheckPasswordAsync(user, loginDto.Password);
            if (!isPasswordValid)
            {
                return Results.BadRequest(Response<string>.Failure("Invalid password."));
            }
            var token = tokenService.GenerateToken(user.Id, user.UserName!);
            AppendAuthCookie(httpContext, token);
            return Results.Ok(Response<string>.Success(string.Empty, "Login successful."));

        });

        group.MapPost("/logout", (HttpContext httpContext) =>
        {
            ClearAuthCookie(httpContext);
            return Results.Ok(Response<string>.Success(string.Empty, "Logout successful."));
        }).RequireAuthorization();

        group.MapGet("/me", async (UserManager<AppUser> userManager, HttpContext httpContext) =>
        {
            var currentLoggedInUserId = httpContext.User.GetUserId();
            var user = await userManager.Users.SingleOrDefaultAsync(x => x.Id == currentLoggedInUserId.ToString());

            if (user is null)
            {
                return Results.Unauthorized();
            }

            return Results.Ok(Response<AppUser>.Success(user, "User fetched successfully."));
        }).RequireAuthorization();
        return group;
    }

    private static void AppendAuthCookie(HttpContext httpContext, string token)
    {
        httpContext.Response.Cookies.Append(AccessTokenCookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = DateTimeOffset.UtcNow.AddDays(1),
            Path = "/",
            Domain = httpContext.Request.Host.Host
        });
    }

    private static void ClearAuthCookie(HttpContext httpContext)
    {
        httpContext.Response.Cookies.Delete(AccessTokenCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = httpContext.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/"
        });
    }
}
