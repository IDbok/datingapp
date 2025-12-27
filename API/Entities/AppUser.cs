using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;

namespace API.Entities;

public class AppUser : IdentityUser
{
    public required string DisplayName { get; set; }
    public string? ImageUrl { get; set; }
    public string? RefreshToken { get; set; } 
    // todo: save refresh token in db encrypted for more security
    // todo: store refresh tokens in separate table to allow multiple devices
    public DateTime? RefreshTokenExpiryTime { get; set; }

    [JsonIgnore]
    public Member Member { get; set; } = null!;
}
