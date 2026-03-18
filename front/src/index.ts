import { boards, boardsComp } from "#state";
import "#ui/board/buttons";
import { getUserInfo as page_getUserInfo } from "#ui/main";
import { switchPage } from "#ui/pages";
import { loadCards as page_loadCards } from "#ui/pages/cards";
import "./wsEvt";

boards[0].id = "board_opponent";
boards[1].id = "board_my";

const rows = boards[0].qs(".rows").children;
rows[0].parentNode.insertBefore(rows[1], rows[0]);

boardsComp[1].events();
switchPage("main");
page_getUserInfo();
page_loadCards();
