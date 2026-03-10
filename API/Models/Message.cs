using System;

namespace API.Models;

public class Message
{
    public int Id { get; set; }
    public string? SenderId { get; set; } = string.Empty;
    public string? ReceiverId { get; set; } = string.Empty;
    public string? Content { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    public bool IsRead { get; set; }
    public AppUser? Receiver { get; set; }
    public AppUser? Sender { get; set; }
}
