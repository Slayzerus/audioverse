using Xunit;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Validators.Events;
using AudioVerse.Application.Validators.User;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class ValidatorTests
    {
        // --- CreateEventCommandValidator ---

        [Fact]
        public void CreateEvent_Valid_Passes()
        {
            var validator = new CreateEventCommandValidator();
            var cmd = new CreateEventCommand(new Event
            {
                Title = "Party",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(1).AddHours(3)
            });

            var result = validator.Validate(cmd);
            Assert.True(result.IsValid);
        }

        [Fact]
        public void CreateEvent_EmptyTitle_Fails()
        {
            var validator = new CreateEventCommandValidator();
            var cmd = new CreateEventCommand(new Event { Title = "" });

            var result = validator.Validate(cmd);
            Assert.False(result.IsValid);
            Assert.Contains(result.Errors, e => e.PropertyName.Contains("Title"));
        }

        [Fact]
        public void CreateEvent_EndBeforeStart_Fails()
        {
            var validator = new CreateEventCommandValidator();
            var cmd = new CreateEventCommand(new Event
            {
                Title = "Test",
                StartTime = DateTime.UtcNow.AddDays(2),
                EndTime = DateTime.UtcNow.AddDays(1)
            });

            var result = validator.Validate(cmd);
            Assert.False(result.IsValid);
            Assert.Contains(result.Errors, e => e.PropertyName.Contains("EndTime"));
        }

        [Fact]
        public void CreateEvent_NegativeMaxParticipants_Fails()
        {
            var validator = new CreateEventCommandValidator();
            var cmd = new CreateEventCommand(new Event
            {
                Title = "Test",
                MaxParticipants = -1
            });

            var result = validator.Validate(cmd);
            Assert.False(result.IsValid);
        }

        // --- RegisterUserCommandValidator ---

        [Fact]
        public void RegisterUser_Valid_Passes()
        {
            var validator = new RegisterUserCommandValidator();
            var cmd = new RegisterUserCommand("john_doe", "john@example.com", "SecureP@ss1");

            var result = validator.Validate(cmd);
            Assert.True(result.IsValid);
        }

        [Fact]
        public void RegisterUser_ShortUsername_Fails()
        {
            var validator = new RegisterUserCommandValidator();
            var cmd = new RegisterUserCommand("ab", "john@example.com", "SecureP@ss1");

            var result = validator.Validate(cmd);
            Assert.False(result.IsValid);
            Assert.Contains(result.Errors, e => e.PropertyName == "Username");
        }

        [Fact]
        public void RegisterUser_InvalidEmail_Fails()
        {
            var validator = new RegisterUserCommandValidator();
            var cmd = new RegisterUserCommand("john_doe", "not-an-email", "SecureP@ss1");

            var result = validator.Validate(cmd);
            Assert.False(result.IsValid);
            Assert.Contains(result.Errors, e => e.PropertyName == "Email");
        }

        [Fact]
        public void RegisterUser_ShortPassword_Fails()
        {
            var validator = new RegisterUserCommandValidator();
            var cmd = new RegisterUserCommand("john_doe", "john@example.com", "short");

            var result = validator.Validate(cmd);
            Assert.False(result.IsValid);
            Assert.Contains(result.Errors, e => e.PropertyName == "Password");
        }

        // --- PlaceBetCommandValidator ---

        [Fact]
        public void PlaceBet_Valid_Passes()
        {
            var validator = new PlaceBetCommandValidator();
            var cmd = new PlaceBetCommand(1, 2, 3, 50m);

            var result = validator.Validate(cmd);
            Assert.True(result.IsValid);
        }

        [Fact]
        public void PlaceBet_ZeroAmount_Fails()
        {
            var validator = new PlaceBetCommandValidator();
            var cmd = new PlaceBetCommand(1, 2, 3, 0);

            var result = validator.Validate(cmd);
            Assert.False(result.IsValid);
            Assert.Contains(result.Errors, e => e.PropertyName == "Amount");
        }

        [Fact]
        public void PlaceBet_ExceedsMax_Fails()
        {
            var validator = new PlaceBetCommandValidator();
            var cmd = new PlaceBetCommand(1, 2, 3, 200_000);

            var result = validator.Validate(cmd);
            Assert.False(result.IsValid);
        }

        // --- SendBulkInvitesCommandValidator ---

        [Fact]
        public void BulkInvites_EmptyContacts_Fails()
        {
            var validator = new SendBulkInvitesCommandValidator();
            var cmd = new SendBulkInvitesCommand(1, 1, Array.Empty<int>(), 1);

            var result = validator.Validate(cmd);
            Assert.False(result.IsValid);
        }

        [Fact]
        public void BulkInvites_TooMany_Fails()
        {
            var validator = new SendBulkInvitesCommandValidator();
            var ids = Enumerable.Range(1, 501).ToArray();
            var cmd = new SendBulkInvitesCommand(1, 1, ids, 1);

            var result = validator.Validate(cmd);
            Assert.False(result.IsValid);
        }

        [Fact]
        public void BulkInvites_Valid_Passes()
        {
            var validator = new SendBulkInvitesCommandValidator();
            var cmd = new SendBulkInvitesCommand(1, 1, new[] { 1, 2, 3 }, 1);

            var result = validator.Validate(cmd);
            Assert.True(result.IsValid);
        }
    }
}
