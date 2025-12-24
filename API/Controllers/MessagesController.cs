using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class MessagesController(IMessageRepository messageRepository, 
    IMemberRepository memberRepository) : BaseApiController
{
    [HttpPost]
    public async Task<ActionResult<MessageDto>> CreateMessage(CreateMessageDto createMessageDto)
    {
        var sender = await memberRepository.GetMemberByIdAsync(User.GetUserId());
        var recipient = await memberRepository.GetMemberByIdAsync(createMessageDto.RecipientId);

        if (sender == null) return NotFound("Sender not found");
        if (recipient == null) return NotFound("Recipient not found");
        if (sender.Id == recipient.Id)
            return BadRequest("You cannot send messages to yourself");

        var message = new Message
        {
            SenderId = sender.Id,
            RecipientId = recipient.Id,
            Content = createMessageDto.Content,
        };
        messageRepository.AddMessage(message);

        if (await messageRepository.SaveAllAsync()) return Ok(message.ToDto());

        return BadRequest("Failed to send message");
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<MessageDto>>> GetMessagesForMember(
        [FromQuery] MessageParams messageParams)
    {
        messageParams.MemberId = User.GetUserId();

        return Ok(await messageRepository.GetMessagesForMember(messageParams));
    }

    [HttpGet("thread/{recipientId}")]
    public async Task<ActionResult<IEnumerable<MessageDto>>> GetMessageThread(string recipientId)
    {
        var currentMemberId = User.GetUserId();
        return Ok(await messageRepository.GetMessageThread(currentMemberId, recipientId));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteMessage(string id)
    {
        var memberId = User.GetUserId();
        var message = await messageRepository.GetMessage(id);

        if (message == null) return NotFound();

        if (message.SenderId != memberId && message.RecipientId != memberId)
            return Unauthorized();

        if (message.SenderId == memberId) message.SenderDeleted = true;
        if (message.RecipientId == memberId) message.RecipientDeleted = true;

        // if (message.SenderDeleted && message.RecipientDeleted)
        //     messageRepository.DeleteMessage(message);

        if (message is { SenderDeleted: true, RecipientDeleted: true })
            messageRepository.DeleteMessage(message);

        if (await messageRepository.SaveAllAsync()) return Ok();

        return BadRequest("Problem deleting the message");
    }
}
