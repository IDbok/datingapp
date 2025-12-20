using System;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class LikesRepository(AppDbContext context) : ILikesRepository
{
    public void AddLike(MemberLike like)
    {
        context.Likes.Add(like);
    }

    public void DeleteLike(MemberLike like)
    {
        context.Likes.Remove(like);
    }

    public async Task<IReadOnlyList<string>> GetCurrentMemberLikeIdsAsync(string memberId)
    {
        return await context.Likes
            .Where(l => l.SourceMemberId == memberId)
            .Select(l => l.TargetMemberId)
            .ToListAsync();  
    }

    public async Task<MemberLike?> GetMemberLikeAsync(string sourceMemberId, string targetMemberId)
    {
        return await context.Likes.FindAsync(sourceMemberId, targetMemberId);
    }

    public async Task<PaginatedResult<Member>> GetMemberLikesAsync(LikesParam likesParam)
    {
        string memberId = likesParam.MemberId;
        string predicate = likesParam.Predicate;

        var query = context.Likes.AsQueryable();
        IQueryable<Member> resultQuery;

        switch (predicate)
        {
            case "liked":                
                resultQuery = query.Where(l => l.SourceMemberId == memberId)
                .Select(l => l.TargetMember);
                break;
            case "likedBy":
                resultQuery = query.Where(l => l.TargetMemberId == memberId)
                    .Select(l => l.SourceMember);
                break;
            default: // mutual
                var likeIds = await GetCurrentMemberLikeIdsAsync(memberId);
                resultQuery = query.Where(l => l.TargetMemberId == memberId 
                        && likeIds.Contains(l.SourceMemberId))
                    .Select(l => l.SourceMember);
                break;
        }

        return await PaginationHelper.CreateAsync(resultQuery,
            likesParam.PageNumber, likesParam.PageSize);
    }

    public async Task<bool> SaveAllAsync()
    {
        return await context.SaveChangesAsync() > 0;
    }
}
