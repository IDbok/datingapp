using System;
using API.DTOs;
using API.Entities;
using API.Helpers;

namespace API.Interfaces;

public interface IMessageRepository
{
    void AddMessage(Message message);
    void DeleteMessage(Message message);
    Task<Message?> GetMessage(string messageId);
    Task<PaginatedResult<MessageDto>> GetMessagesForMember(MessageParams messageParams);
    Task<IEnumerable<MessageDto>> GetMessageThread(string currentMemberId, string recipientMemberId);
    Task<bool> SaveAllAsync();
}
