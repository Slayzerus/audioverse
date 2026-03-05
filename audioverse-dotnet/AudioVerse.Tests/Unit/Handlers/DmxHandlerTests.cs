using Xunit;
using AudioVerse.Application.Commands.DMX;
using AudioVerse.Application.Queries.DMX;
using AudioVerse.Application.Handlers.DMX;
using AudioVerse.Application.Services.DMX;
using MediatR;
using Microsoft.Extensions.Options;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class DmxHandlerTests
    {
        private static DmxState CreateState(int channels = 512, int fps = 30) =>
            new(Options.Create(new DmxOptions { UniverseSize = channels, Fps = fps }));

        [Fact]
        public async Task SetChannelValue_SetsCorrectly()
        {
            var state = CreateState();
            var handler = new SetChannelValueHandler(state);

            await handler.Handle(new SetChannelValueCommand(1, 128), CancellationToken.None);

            var snapshot = state.Snapshot();
            Assert.Equal(128, snapshot[1]);
        }

        [Fact]
        public async Task SetChannelValue_OutOfRange_Throws()
        {
            var state = CreateState();
            var handler = new SetChannelValueHandler(state);

            await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
                handler.Handle(new SetChannelValueCommand(0, 100), CancellationToken.None));
        }

        [Fact]
        public async Task Blackout_ClearsAllChannels()
        {
            var state = CreateState();
            state.SetChannel(1, 255);
            state.SetChannel(100, 200);

            var handler = new BlackoutHandler(state);
            await handler.Handle(new BlackoutCommand(), CancellationToken.None);

            var snapshot = state.Snapshot();
            for (int i = 1; i < snapshot.Length; i++)
                Assert.Equal(0, snapshot[i]);
        }

        [Fact]
        public async Task GetDmxState_ReturnsFpsAndSnapshot()
        {
            var state = CreateState(fps: 40);
            state.SetChannel(5, 99);

            var handler = new GetDmxStateHandler(state);
            var result = await handler.Handle(new GetDmxStateQuery(), CancellationToken.None);

            Assert.Equal(40u, result.Fps);
            Assert.Equal(99, result.FrontSnapshot[5]);
        }

        [Fact]
        public async Task GetDmxState_AfterBlackout_AllZero()
        {
            var state = CreateState();
            state.SetChannel(10, 255);
            state.Blackout();

            var handler = new GetDmxStateHandler(state);
            var result = await handler.Handle(new GetDmxStateQuery(), CancellationToken.None);

            Assert.Equal(0, result.FrontSnapshot[10]);
        }
    }
}
