using System;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

[Authorize]
public class MessageHub(IMessageRepository messageRepository, 
    IMemberRepository memberRepository, IHubContext<PresenceHub> presenceHub) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var HttpContext = Context.GetHttpContext();
        var otherUser = HttpContext?.Request?.Query["userId"].ToString() ??
            throw new HubException("Other user not specified");
        var groupName = GetGroupName(GetUserId(), otherUser);

        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await AddToGroupAsync(groupName);

        var messages = await messageRepository.GetMessageThread(GetUserId(), otherUser);

        await Clients.Group(groupName)
            .SendAsync("ReceiveMessageThread", messages);
    }

    public async Task SendMessage(CreateMessageDto createMessageDto)
    {
        var sender = await memberRepository.GetMemberByIdAsync(GetUserId());
        var recipient = await memberRepository.GetMemberByIdAsync(createMessageDto.RecipientId);

        if (sender == null) throw new HubException("Sender not found");
        if (recipient == null) throw new HubException("Recipient not found");
        if (sender.Id == recipient.Id)
            throw new HubException("You cannot send messages to yourself");

        var message = new Message
        {
            SenderId = sender.Id,
            RecipientId = recipient.Id,
            Content = createMessageDto.Content,
        };

        var groupName = GetGroupName(sender.Id, recipient.Id);
        var group = await messageRepository.GetMessageGroup(groupName);
        var isUserInGroup = group?.Connections.Any(x => x.UserId == recipient.Id) ?? false;

        if (isUserInGroup)
        {
            message.ReadAt = DateTime.UtcNow;
        }

        messageRepository.AddMessage(message);

        if (await messageRepository.SaveAllAsync())
        {
            var messageDto = message.ToDto();
            await Clients.Group(groupName)
                .SendAsync("NewMessage", messageDto);
            var connections = await PresenceTracker.GetConnectionsForUser(recipient.Id);
            if (connections.Count != 0 && isUserInGroup == false)
            {
                await presenceHub.Clients.Clients(connections)
                    .SendAsync("NewMessageReceived", messageDto);
            }
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await messageRepository.RemoveConnection(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    private async Task<bool> AddToGroupAsync(string groupName)
    {
        var group = await messageRepository.GetMessageGroup(groupName);
        var connection = new Connection(Context.ConnectionId, GetUserId());
        if (group == null)
        {
            group = new Group(groupName);
            messageRepository.AddGroup(group);
        }

        group.Connections.Add(connection);
        return await messageRepository.SaveAllAsync();
    }

    private string GetGroupName(string? caller, string? other)
    {
        var stringCompare = string.CompareOrdinal(caller, other) < 0;
        return stringCompare ? $"{caller}-{other}" : $"{other}-{caller}";
    }

    private string GetUserId()
    {
        return Context.User?.GetUserId()
            ?? throw new InvalidOperationException("User ID not found in claims");
    }

}
