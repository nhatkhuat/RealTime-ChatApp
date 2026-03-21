using System;
using System.Collections.Concurrent;
using API.Data;
using API.DTOs;
using API.Extensions;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace API.Hubs;

[Authorize]
public class ChatHub(UserManager<AppUser> userManager, AppDbContext dbContext) : Hub
{
    public static readonly ConcurrentDictionary<string, OnlineUserDto> onlineUsers = new();

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var receiverId = httpContext?.Request.Query["receiverId"].ToString();
        var username = Context.User?.Identity?.Name;
        var currentUser = await userManager.FindByNameAsync(username);
        var connectionId = Context.ConnectionId;
        if (onlineUsers.ContainsKey(username))
        {
            onlineUsers[username].ConnectionId = connectionId;
            onlineUsers[username].IsOnline = true;
        }
        else
        {
            var user = new OnlineUserDto
            {
                Id = currentUser.Id,
                ConnectionId = connectionId,
                UserName = currentUser.UserName,
                FullName = currentUser.FullName,
                ProfileImage = currentUser.ProfileImage,
                IsOnline = true,
                UnreadCount = dbContext.Messages.Count(m => m.ReceiverId == currentUser.Id && !m.IsRead)
            };
            onlineUsers.TryAdd(username, user);
            await Clients.AllExcept(connectionId).SendAsync("Notify", currentUser);
        }
        if (!string.IsNullOrEmpty(receiverId))
        {
            await LoadMessages(receiverId);
        }
        await Clients.All.SendAsync("onlineUsers", await GetOnlineUsers());
    }

    public async Task LoadMessages(string recepientId, int pageNumber = 1)
    {
        int pageSize = 10;

        var username = Context.User!.Identity!.Name;
        var currentUser = await userManager.FindByNameAsync(username);
        if (currentUser == null)
            return;

        List<MessageResponseDto> messages = await dbContext.Messages
        .Where(m => (m.SenderId == currentUser.Id && m.ReceiverId == recepientId)
        || (m.SenderId == recepientId && m.ReceiverId == currentUser.Id))
        .OrderByDescending(m => m.CreatedDate)
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .Select(m => new MessageResponseDto
        {
            Id = m.Id,
            SenderId = m.SenderId,
            ReceiverId = m.ReceiverId,
            Content = m.Content,
            CreatedDate = m.CreatedDate
        })
        .ToListAsync();

        foreach (var message in messages)
        {
            var msg = await dbContext.Messages.FirstOrDefaultAsync(x => x.Id == message.Id);
            if (msg != null && msg.ReceiverId == currentUser.Id)
            {
                msg.IsRead = true;
                await dbContext.SaveChangesAsync();
            }
        }
        // await Task.Delay(2000);
        await Clients.User(currentUser.Id).SendAsync("ReceiveMessageList", messages);
    }
    public async Task SendMessage(MessageRequestDto message)
    {
        var senderId = Context.User!.Identity!.Name;
        var recepientId = message.ReceiverId;
        var currentUser = await userManager.FindByNameAsync(senderId);
        var newMessage = new Message
        {
            Sender = await userManager.FindByNameAsync(senderId),
            Receiver = await userManager.FindByIdAsync(recepientId),
            IsRead = false,
            Content = message.Content,
            CreatedDate = DateTime.UtcNow
        };
        dbContext.Messages.Add(newMessage);
        await dbContext.SaveChangesAsync();
        await Clients.User(recepientId).SendAsync("ReceiveNewMessage", newMessage);
    }

    public async Task NotifyTyping(string recepientUserName)
    {
        var senderUserName = Context.User!.Identity!.Name;
        if (senderUserName is null)
            return;
        var connectionId = onlineUsers.Values.FirstOrDefault(u => u.UserName == recepientUserName)?.ConnectionId;
        if (connectionId != null)
        {
            await Clients.Client(connectionId).SendAsync("NotifyTyping", senderUserName);
        }
    }
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var senderUserName = Context.User!.Identity!.Name;
        onlineUsers.TryRemove(senderUserName, out _);

        await Clients.All.SendAsync("OnlineUsers", await GetOnlineUsers());

    }
    public async Task<IEnumerable<OnlineUserDto>> GetOnlineUsers()
    {
        var username = Context.User!.GetUserName();
        var onlineUsersSet = new HashSet<string>(onlineUsers.Keys);
        var users = await userManager.Users.Select(u => new OnlineUserDto
        {
            Id = u.Id,
            UserName = u.UserName,
            FullName = u.FullName,
            ProfileImage = u.ProfileImage,
            IsOnline = onlineUsersSet.Contains(u.UserName),
            UnreadCount = dbContext.Messages.Count(m => m.ReceiverId == username
            && m.SenderId == u.Id
            && !m.IsRead)
        }).OrderByDescending(u => u.IsOnline).ToListAsync();

        return users;
    }

}
