using System;
using System.Security.Claims;
using API.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

[Authorize]
public class PresenceHub(PresenceTracker presenceTracker) : Hub
{
    public override async Task OnConnectedAsync()
    {
        // var httpContext = Context.GetHttpContext();
        // var userName = Context.User?.Identity?.Name;

        // if (userName != null)
        // {
        //     await Groups.AddToGroupAsync(Context.ConnectionId, "OnlineUsers");
        //     await Clients.Group("OnlineUsers").SendAsync("UserIsOnline", userName);
        // }

        // await base.OnConnectedAsync();

        await presenceTracker.UserConnected(
            GetUserId(), 
            Context.ConnectionId);
        await Clients.Others.SendAsync("UserIsOnline", GetUserId());

        var currentUsers = await presenceTracker.GetOnlineUsers();
        await Clients.Caller.SendAsync("GetOnlineUsers", currentUsers);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // var userName = Context.User?.Identity?.Name;

        // if (userName != null)
        // {
        //     await Groups.RemoveFromGroupAsync(Context.ConnectionId, "OnlineUsers");
        //     await Clients.Group("OnlineUsers").SendAsync("UserIsOffline", userName);
        // }

        // await base.OnDisconnectedAsync(exception);

        await presenceTracker.UserDisconnected(
            GetUserId(), 
            Context.ConnectionId);
            
        await Clients.Others.SendAsync("UserIsOffline",
            GetUserId());

        var currentUsers = await presenceTracker.GetOnlineUsers();
        await Clients.Caller.SendAsync("GetOnlineUsers", currentUsers);
        
        await base.OnDisconnectedAsync(exception);
    }

    private string GetUserId()
    {
        return Context.User?.GetUserId()
            ?? throw new InvalidOperationException("User ID not found in claims");
    }
}
