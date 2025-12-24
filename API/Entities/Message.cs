using System;

namespace API.Entities;

public class Message
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Content { get; set; } = null!;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
    public bool SenderDeleted { get; set; } = false;
    public bool RecipientDeleted { get; set; } = false;

    public required string SenderId { get; set; } = null!;
    public Member Sender { get; set; } = null!;
    public required string RecipientId { get; set; } = null!;
    public Member Recipient { get; set; } = null!;
}
