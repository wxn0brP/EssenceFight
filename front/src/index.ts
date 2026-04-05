import { setupKeyboardEvents } from "#keyboard";
import { boards, boardsComp } from "#state";
import "#ui/board/buttons";
import { setupTargetingEvents } from "#ui/board/targeting";
import { setupUnusedCardsEvents } from "#ui/board/unused";
import { getUserInfo as page_getUserInfo } from "#ui/main";
import { switchPage } from "#ui/pages";
import { loadCards as page_loadCards } from "#ui/pages/cards";
import "./bot";
import "./wsEvt";

boards[0].id = "board_opponent";
boards[1].id = "board_my";

const rows = boards[0].qs(".rows").children;
rows[0].parentNode.insertBefore(rows[1], rows[0]);

boardsComp[1].events();
setupUnusedCardsEvents();
setupTargetingEvents();
setupKeyboardEvents();
switchPage("main");
page_getUserInfo();
page_loadCards();
