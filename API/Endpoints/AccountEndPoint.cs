using System;
using API.Common;
using API.DTOs;
using API.Models;
using API.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Endpoints;

public static class AccountEndPoint
{
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
            var picture = await FileUpload.UploadFile(profileImage);
            picture = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}/uploads/{picture}";

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

        group.MapPost("/login", async (UserManager<AppUser> userManager, TokenService tokenService, LoginDto loginDto) =>
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
            return Results.Ok(Response<string>.Success(token, "Login successful."));

        });

        return group;
    }
}
