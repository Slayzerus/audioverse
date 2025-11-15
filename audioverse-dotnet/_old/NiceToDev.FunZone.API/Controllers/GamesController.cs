using Microsoft.AspNetCore.Mvc;

namespace NiceToDev.FunZone.API.Controllers
{
    public class GamesController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
