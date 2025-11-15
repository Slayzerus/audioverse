namespace NiceToDev.FunZone.Application.Models
{
    public class SteamApiResponse
    {
        public ResponseData Response { get; set; } = new ResponseData();

        public class ResponseData
        {
            public int GameCount { get; set; }
            public List<SteamGame> Games { get; set; } = new();
        }
    }
}
