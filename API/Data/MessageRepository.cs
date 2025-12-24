using System;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class MessageRepository(AppDbContext context) : IMessageRepository
{
    public void AddMessage(Message message)
    {
        context.Messages.Add(message);
    }

    public void DeleteMessage(Message message)
    {
        context.Messages.Remove(message);
    }

    public async Task<Message?> GetMessage(string messageId)
    {
        return await context.Messages.FindAsync(messageId);
    }

    public async Task<PaginatedResult<MessageDto>> GetMessagesForMember(MessageParams messageParams)
    {
        var query = context.Messages
            .OrderByDescending(m => m.SentAt)
            .AsQueryable();

        query = messageParams.Container.ToLower() switch
        {
            // "inbox" => query.Where(m => m.RecipientId == messageParams.MemberId && !m.RecipientDeleted),
            "outbox" => query.Where(m => m.SenderId == messageParams.MemberId 
                && !m.SenderDeleted),
            _ => query.Where(m => m.RecipientId == messageParams.MemberId 
                && !m.RecipientDeleted)
        };

        var messageQuery = query.Select(MessageExtensions.AsDto());

        return await PaginationHelper.CreateAsync(messageQuery, 
            messageParams.PageNumber, messageParams.PageSize);
    }

    public async Task<IEnumerable<MessageDto>> GetMessageThread(string currentMemberId, string recipientMemberId)
    {
        await context.Messages
            .Where(m => m.RecipientId == currentMemberId 
                && m.SenderId == recipientMemberId && m.ReadAt == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(m => m.ReadAt, DateTime.UtcNow));

        return await context.Messages
            .Where(m => (m.RecipientId == currentMemberId 
                && !m.RecipientDeleted && m.SenderId == recipientMemberId)
                || (m.RecipientId == recipientMemberId 
                && !m.SenderDeleted && m.SenderId == currentMemberId))
            .OrderBy(m => m.SentAt)
            .Select(MessageExtensions.AsDto())
            .ToListAsync();
    }

    public async Task<bool> SaveAllAsync()
    {
        return await context.SaveChangesAsync() > 0;
    }
}
