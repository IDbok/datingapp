using System.Security.Cryptography;
using System.Text;
using API.DTOs;
using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class Seed
{
    public static async Task SeedUsers(UserManager<AppUser> userManager)
    {
        if (await userManager.Users.AnyAsync()) return;

        var memberData = await File.ReadAllTextAsync("Data/UserSeedData.json");
        var members = System.Text.Json.JsonSerializer.Deserialize<List<SeedUserDto>>(memberData);

        if (members == null) return;

        foreach (var member in members)
        {
            var user = new AppUser
            {
                Id = member.Id,
                DisplayName = member.DisplayName,
                Email = member.Email.ToLower(),
                UserName = member.Email.ToLower(),
                ImageUrl = member.ImageUrl,
                Member = new Member
                {
                    Id = member.Id,
                    DisplayName = member.DisplayName,
                    ImageUrl = member.ImageUrl,
                    Description = member.Description,
                    DateOfBirth = member.DateOfBirth,
                    Created = member.Created,
                    LastActive = member.LastActive,
                    Gender = member.Gender,
                    City = member.City,
                    Country = member.Country
                }
            };

            if (member.ImageUrl != null)
            {
                user.Member.Photos.Add(new Photo
                {
                    Url = member.ImageUrl,
                    MemberId = member.Id
                });
            }

            var result = await userManager.CreateAsync(user, "Pa$$w0rd");

            if (!result.Succeeded)
            {
                Console.WriteLine($"Failed to create user {member.Email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }

            await userManager.AddToRoleAsync(user, "Member");
        }

        var admin = new AppUser
        {
            DisplayName = "Admin",
            Email = "admin@example.com",
            UserName = "Admin"
        };

        await userManager.CreateAsync(admin, "Pa$$w0rd");
        await userManager.AddToRolesAsync(admin, ["Admin", "Moderator"]);

        System.Console.WriteLine("Seeded users and members to the database");
    }

}
