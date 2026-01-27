import { boards, boardsComp } from "#state";
import "#ui/board/buttons";
import "./wsEvt";

boards[0].id = "board_opponent";
boards[1].id = "board_my";

const rows = boards[0].qs(".rows").children;
rows[0].parentNode.insertBefore(rows[1], rows[0]);

boardsComp[1].events();