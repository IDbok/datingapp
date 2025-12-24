using System;

namespace API.Helpers;

public class MessageParams : PagingParams
{
    public string MemberId { get; set; } = string.Empty;
    public string Container { get; set; } = "Inbox";
}
