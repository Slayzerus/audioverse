using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AudioVerse.API.Areas.Admin.Controllers;
using AudioVerse.API.Models.Admin;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Services;
using AudioVerse.Domain.Entities.Admin;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.Tests.Controllers.Admin
{
    public class SystemConfigurationControllerTests
    {
        [Fact]
        public async Task Create_ReturnsBadRequest_When_GlobalMaxListenersPerStation_TooLow()
        {
            var mockRepo = new Mock<ISystemConfigRepository>();
            mockRepo.Setup(r => r.GetActiveConfigAsync()).ReturnsAsync((SystemConfiguration?)null);
            mockRepo.Setup(r => r.CreateConfigAsync(It.IsAny<SystemConfiguration>())).ReturnsAsync(1);
            mockRepo.Setup(r => r.GetStationsExceedingListenerLimitAsync(100))
                .ReturnsAsync(new List<int> { 1 });

            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(42);

            var controller = new SystemConfigurationController(mockRepo.Object, mockUser.Object);

            var req = new SystemConfigurationRequest
            {
                SessionTimeoutMinutes = 30,
                MaxMicrophonePlayers = 4,
                GlobalMaxListenersPerStation = 100,
                Active = true
            };

            var res = await controller.Create(req);
            Assert.IsType<BadRequestObjectResult>(res);
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_When_GlobalMaxTotalListeners_TooLow()
        {
            var mockRepo = new Mock<ISystemConfigRepository>();
            mockRepo.Setup(r => r.GetActiveConfigAsync()).ReturnsAsync((SystemConfiguration?)null);
            mockRepo.Setup(r => r.CreateConfigAsync(It.IsAny<SystemConfiguration>())).ReturnsAsync(1);
            mockRepo.Setup(r => r.GetStationsExceedingListenerLimitAsync(It.IsAny<int>()))
                .ReturnsAsync(new List<int>());
            mockRepo.Setup(r => r.GetActiveListenerCountAsync()).ReturnsAsync(3);

            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(99);

            var controller = new SystemConfigurationController(mockRepo.Object, mockUser.Object);

            var req = new SystemConfigurationRequest
            {
                SessionTimeoutMinutes = 30,
                MaxMicrophonePlayers = 4,
                GlobalMaxTotalListeners = 2,
                Active = true
            };

            var res = await controller.Create(req);
            Assert.IsType<BadRequestObjectResult>(res);
        }

        [Fact]
        public async Task Create_CreatesConfig_When_Valid()
        {
            var mockRepo = new Mock<ISystemConfigRepository>();
            mockRepo.Setup(r => r.GetActiveConfigAsync()).ReturnsAsync((SystemConfiguration?)null);
            mockRepo.Setup(r => r.CreateConfigAsync(It.IsAny<SystemConfiguration>())).ReturnsAsync(123).Verifiable();
            mockRepo.Setup(r => r.GetStationsExceedingListenerLimitAsync(It.IsAny<int>()))
                .ReturnsAsync(new List<int>());
            mockRepo.Setup(r => r.GetActiveListenerCountAsync()).ReturnsAsync(0);
            mockRepo.Setup(r => r.AddAuditLogAsync(It.IsAny<AuditLog>())).Returns(Task.CompletedTask).Verifiable();

            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(5);

            var controller = new SystemConfigurationController(mockRepo.Object, mockUser.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var req = new SystemConfigurationRequest
            {
                SessionTimeoutMinutes = 30,
                MaxMicrophonePlayers = 4,
                GlobalMaxTotalListeners = 100,
                GlobalMaxListenersPerStation = 50,
                Active = true
            };

            var res = await controller.Create(req);
            var created = Assert.IsType<CreatedAtActionResult>(res);
            Assert.Equal(nameof(SystemConfigurationController.GetActive), created.ActionName);

            mockRepo.Verify(r => r.CreateConfigAsync(It.IsAny<SystemConfiguration>()), Times.Once);
            mockRepo.Verify(r => r.AddAuditLogAsync(It.IsAny<AuditLog>()), Times.Once);
        }
    }
}
