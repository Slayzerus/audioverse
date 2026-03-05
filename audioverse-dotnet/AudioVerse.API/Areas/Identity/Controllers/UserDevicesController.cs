using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Models.Requests.User;
using AudioVerse.Application.Queries.User;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// User devices and microphone management.
    /// </summary>
    [ApiController]
    [Route("api/user")]
    [Produces("application/json")]
    [Consumes("application/json")]
    [Tags("Identity - Devices")]
    [Authorize]
    public class UserDevicesController(IMediator mediator) : ControllerBase
    {
        // ── Devices ──

        /// <summary>Create a device entry for current user.</summary>
        [HttpPost("devices")]
        public async Task<IActionResult> CreateDevice([FromBody] CreateDeviceRequest request)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Success = false, Message = "Unauthorized" });

            var userId = int.Parse(userIdClaim);
            var command = new CreateDeviceCommand(userId, request.DeviceId, request.DeviceName, request.UserDeviceName, request.DeviceType, request.Visible);
            var id = await mediator.Send(command);
            return Ok(new { Success = true, DeviceId = id });
        }

        /// <summary>Update a device entry.</summary>
        [HttpPut("devices/{deviceRecordId}")]
        public async Task<IActionResult> UpdateDevice(int deviceRecordId, [FromBody] UpdateDeviceRequest request)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Success = false, Message = "Unauthorized" });

            var userId = int.Parse(userIdClaim);
            var command = new UpdateDeviceCommand(deviceRecordId, userId, request.DeviceId, request.DeviceName, request.UserDeviceName, request.DeviceType, request.Visible);
            var result = await mediator.Send(command);
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false, Message = "Device not found" });
        }

        /// <summary>Delete a device entry.</summary>
        [HttpDelete("devices/{deviceRecordId}")]
        public async Task<IActionResult> DeleteDevice(int deviceRecordId)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Success = false, Message = "Unauthorized" });

            var userId = int.Parse(userIdClaim);
            var command = new DeleteDeviceCommand(deviceRecordId, userId);
            var result = await mediator.Send(command);
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false, Message = "Device not found" });
        }

        /// <summary>Get all devices for current user.</summary>
        [HttpGet("devices")]
        public async Task<IActionResult> GetDevices()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Success = false, Message = "Unauthorized" });

            var userId = int.Parse(userIdClaim);
            var devices = await mediator.Send(new GetUserDevicesQuery(userId));
            return Ok(new { Success = true, Devices = devices });
        }

        // ── Microphones ──

        /// <summary>Create a microphone entry for current user.</summary>
        [HttpPost("microphones")]
        public async Task<IActionResult> CreateMicrophone([FromBody] CreateMicrophoneRequest request)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostep" });

            var userId = int.Parse(userIdClaim);
            var command = new CreateMicrophoneCommand(
                userId, request.DeviceId, request.Volume, request.Threshold,
                request.Visible, request.MicGain, request.MonitorEnabled, request.MonitorVolume,
                request.PitchThreshold, request.SmoothingWindow, request.HysteresisFrames,
                request.RmsThreshold, request.UseHanning, request.PitchDetectionMethod, request.OffsetMs);

            var id = await mediator.Send(command);
            return Ok(new { Success = true, MicrophoneId = id });
        }

        /// <summary>Update a user microphone settings.</summary>
        [HttpPut("microphones/{id}")]
        public async Task<IActionResult> UpdateMicrophoneById(int id, [FromBody] UpdateMicrophoneRequest request)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostep" });

            var userId = int.Parse(userIdClaim);
            var command = new UpdateMicrophoneCommand(
                id, userId, request.DeviceId, request.Volume, request.Threshold,
                request.Visible, request.MicGain, request.MonitorEnabled, request.MonitorVolume,
                request.PitchThreshold, request.SmoothingWindow, request.HysteresisFrames,
                request.RmsThreshold, request.UseHanning, request.PitchDetectionMethod, request.OffsetMs);

            var result = await mediator.Send(command);
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false, Message = "Microphone not found" });
        }

        /// <summary>Delete a user microphone.</summary>
        [HttpDelete("microphones/{id}")]
        public async Task<IActionResult> DeleteMicrophoneById(int id)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostep" });

            var userId = int.Parse(userIdClaim);
            var command = new DeleteMicrophoneCommand(id, userId);
            var result = await mediator.Send(command);
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false, Message = "Microphone not found" });
        }

        /// <summary>List all microphones for the current user.</summary>
        [HttpGet("microphones")]
        public async Task<IActionResult> GetMicrophones()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostep" });

            var userId = int.Parse(userIdClaim);
            var mics = await mediator.Send(new GetUserMicrophonesQuery(userId));
            return Ok(new { Success = true, Microphones = mics });
        }

        // ── Microphone Assignments ──

        /// <summary>Get all microphone assignments.</summary>
        [HttpGet("microphone-assignments")]
        public async Task<IActionResult> GetMicrophoneAssignments()
        {
            var assignments = await mediator.Send(new GetMicrophoneAssignmentsQuery());
            return Ok(new { Success = true, Assignments = assignments });
        }

        /// <summary>Assign a microphone to a slot with color.</summary>
        [HttpPost("microphone-assignments")]
        public async Task<IActionResult> CreateMicrophoneAssignment([FromBody] CreateMicrophoneAssignmentRequest request)
        {
            var id = await mediator.Send(new CreateMicrophoneAssignmentCommand(request.UserId, request.MicrophoneId, request.Color, request.Slot));
            return Ok(new { Success = true, AssignmentId = id });
        }

        /// <summary>Update microphone assignment (color/slot).</summary>
        [HttpPut("microphone-assignments/{assignmentId}")]
        public async Task<IActionResult> UpdateMicrophoneAssignment(int assignmentId, [FromBody] UpdateMicrophoneAssignmentRequest request)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Success = false, Message = "Unauthorized" });

            var userId = int.Parse(userIdClaim);
            var command = new UpdateMicrophoneAssignmentCommand(assignmentId, userId, request.Color, request.Slot);
            var result = await mediator.Send(command);
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false, Message = "Assignment not found" });
        }

        /// <summary>Delete microphone assignment.</summary>
        [HttpDelete("microphone-assignments/{assignmentId}")]
        public async Task<IActionResult> DeleteMicrophoneAssignment(int assignmentId)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Success = false, Message = "Unauthorized" });

            var userId = int.Parse(userIdClaim);
            var command = new DeleteMicrophoneAssignmentCommand(assignmentId, userId);
            var result = await mediator.Send(command);
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false, Message = "Assignment not found" });
        }
    }
}
