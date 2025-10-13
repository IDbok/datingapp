using System.Security.Cryptography;
using System.Text;
using API.DTOs;
using API.Entities;
using Microsoft.AspNetCore.SignalR;

namespace API.Data;

public class Seed
{
    public static async Task SeedUsers(AppDbContext context)
    {
        if (context.Users.Any()) return;

        var memberData = await File.ReadAllTextAsync("Data/UserSeedData.json");
        var members = System.Text.Json.JsonSerializer.Deserialize<List<SeedUserDto>>(memberData);

        if (members == null) return;

        foreach (var member in members)
        {
            using var hmac = new HMACSHA512();
            var user = new AppUser
            {
                Id = member.Id,
                DisplayName = member.DisplayName,
                Email = member.Email.ToLower(),
                PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes("Pa$$w0rd")),
                PasswordSalt = hmac.Key,
                ImageUrl = member.ImageUrl,
                Member = new Member
                {
                    Id = member.Id,
                    DisplayName = member.DisplayName,
                    ImageUrl = member.ImageUrl,
                    // Description = member.Description,
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

            context.Users.Add(user);
        }

        await context.SaveChangesAsync();
        System.Console.WriteLine("Seeded users and members to the database");
    }

}
