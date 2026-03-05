using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Identity;
using AudioVerse.Application.Commands.User;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Application.Handlers.User
{   
    public class RegisterUserHandler : IRequestHandler<RegisterUserCommand, int>
    {
        private readonly UserManager<UserProfile> _userManager;
        private readonly AudioVerse.Infrastructure.Email.IEmailSender _emailSender;
        private readonly IConfiguration _configuration;

        public RegisterUserHandler(UserManager<UserProfile> userManager, AudioVerse.Infrastructure.Email.IEmailSender emailSender, IConfiguration configuration)
        {
            _userManager = userManager;
            _emailSender = emailSender;
            _configuration = configuration;
        }

        public async Task<int> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
        {
            var existingUser = await _userManager.FindByNameAsync(request.Username);
            if (existingUser != null) throw new Exception("Username already exists");

            var user = new UserProfile
            {
                UserName = request.Username,
                Email = request.Email
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                throw new Exception($"User creation failed: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }

            // Generate email confirmation token and send a verification email (useful for dev + MailHog)
            try
            {
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                var frontend = _configuration["Frontend:Url"] ?? _configuration["FrontendUrl"] ?? "http://localhost:5173";
                var encoded = System.Net.WebUtility.UrlEncode(token);
                var confirmUrl = $"{frontend.TrimEnd('/')}/confirm-email?userId={user.Id}&token={encoded}";
                var subject = "Confirm your AudioVerse account";
                var body = $"<p>Hi {user.UserName},</p><p>Please confirm your account by clicking the link below:</p><p><a href=\"{confirmUrl}\">Confirm email</a></p>";
                await _emailSender.SendAsync(user.Email ?? string.Empty, subject, body, html: true);
            }
            catch {
                // don't fail registration if email sending fails
            }

            return user.Id;
        }
    }

}
