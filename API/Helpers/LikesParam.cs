namespace API.Helpers;

public class LikesParam : PagingParams
{
    public string MemberId { get; set; } = string.Empty;
    public string Predicate { get; set; } = string.Empty;

}
