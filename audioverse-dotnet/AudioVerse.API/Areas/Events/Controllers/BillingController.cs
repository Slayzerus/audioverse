using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.API.Areas.Events.Controllers
{
    [ApiController]
    [Route("api/events/{eventId}/billing")]
    [Authorize]
    public class BillingController : ControllerBase
    {
        private readonly IMediator _mediator;
        public BillingController(IMediator mediator) { _mediator = mediator; }

        // ??????????????????????????????????????????????????
        //  EXPENSES
        // ??????????????????????????????????????????????????

        /// <summary>Add an expense to the event</summary>
        [HttpPost("expenses")]
        public async Task<IActionResult> AddExpense(int eventId, [FromBody] EventExpense expense)
        {
            if (expense == null) return BadRequest();
            expense.EventId = eventId;
            expense.CreatedAt = DateTime.UtcNow;
            var id = await _mediator.Send(new AddExpenseCommand(expense));
            return CreatedAtAction(nameof(GetExpense), new { eventId, expenseId = id }, new { Id = id });
        }

        /// <summary>List all expenses for an event</summary>
        [HttpGet("expenses")]
        public async Task<IActionResult> GetExpenses(int eventId)
            => Ok(await _mediator.Send(new GetExpensesByEventQuery(eventId)));

        /// <summary>Get a specific expense with shares</summary>
        [HttpGet("expenses/{expenseId}")]
        public async Task<IActionResult> GetExpense(int eventId, int expenseId)
        {
            var e = await _mediator.Send(new GetExpenseByIdQuery(expenseId));
            return e != null ? Ok(e) : NotFound();
        }

        /// <summary>Update an expense</summary>
        [HttpPut("expenses/{expenseId}")]
        public async Task<IActionResult> UpdateExpense(int eventId, int expenseId, [FromBody] EventExpense expense)
        {
            if (expense == null) return BadRequest();
            expense.Id = expenseId; expense.EventId = eventId;
            return await _mediator.Send(new UpdateExpenseCommand(expense)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Delete an expense</summary>
        [HttpDelete("expenses/{expenseId}")]
        public async Task<IActionResult> DeleteExpense(int eventId, int expenseId)
            => await _mediator.Send(new DeleteExpenseCommand(expenseId)) ? NoContent() : NotFound();

        /// <summary>Split an expense equally among all event participants</summary>
        [HttpPost("expenses/{expenseId}/split-equally")]
        public async Task<IActionResult> SplitEqually(int eventId, int expenseId)
        {
            var count = await _mediator.Send(new SplitExpenseEquallyCommand(expenseId));
            return Ok(new { SharesCreated = count });
        }

        /// <summary>Import expenses from poll results (options with UnitCost)</summary>
        [HttpPost("import-from-poll/{pollId}")]
        public async Task<IActionResult> ImportFromPoll(int eventId, int pollId)
        {
            var count = await _mediator.Send(new ImportExpensesFromPollCommand(pollId));
            return Ok(new { ExpensesCreated = count });
        }

        // ??????????????????????????????????????????????????
        //  PAYMENTS
        // ??????????????????????????????????????????????????

        /// <summary>Record a payment from a participant</summary>
        [HttpPost("payments")]
        public async Task<IActionResult> AddPayment(int eventId, [FromBody] EventPayment payment)
        {
            if (payment == null) return BadRequest();
            payment.EventId = eventId;
            payment.PaidAt = DateTime.UtcNow;
            var id = await _mediator.Send(new AddPaymentCommand(payment));
            return CreatedAtAction(nameof(GetPayments), new { eventId }, new { Id = id });
        }

        /// <summary>List all payments for an event</summary>
        [HttpGet("payments")]
        public async Task<IActionResult> GetPayments(int eventId)
            => Ok(await _mediator.Send(new GetPaymentsByEventQuery(eventId)));

        /// <summary>Update a payment</summary>
        [HttpPut("payments/{paymentId}")]
        public async Task<IActionResult> UpdatePayment(int eventId, int paymentId, [FromBody] EventPayment payment)
        {
            if (payment == null) return BadRequest();
            payment.Id = paymentId; payment.EventId = eventId;
            return await _mediator.Send(new UpdatePaymentCommand(payment)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Confirm a payment (organizer/admin action)</summary>
        [HttpPost("payments/{paymentId}/confirm")]
        public async Task<IActionResult> ConfirmPayment(int eventId, int paymentId)
        {
            var uid = User.FindFirst("id")?.Value;
            if (!int.TryParse(uid, out var userId)) return Unauthorized();
            return await _mediator.Send(new ConfirmPaymentCommand(paymentId, userId))
                ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Delete a payment record</summary>
        [HttpDelete("payments/{paymentId}")]
        public async Task<IActionResult> DeletePayment(int eventId, int paymentId)
            => await _mediator.Send(new DeletePaymentCommand(paymentId)) ? NoContent() : NotFound();

        // ??????????????????????????????????????????????????
        //  SETTLEMENT / RECONCILIATION
        // ??????????????????????????????????????????????????

        /// <summary>
        /// Get consolidated settlement for the event.
        /// Shows per-participant: total owed, total paid, balance, and whether settled.
        /// </summary>
        [HttpGet("settlement")]
        public async Task<IActionResult> GetSettlement(int eventId)
            => Ok(await _mediator.Send(new GetEventBillingSettlementQuery(eventId)));
    }
}

