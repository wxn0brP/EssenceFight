import { VQL } from "#db";
import { AnyCard } from "#shared/types/card";

export const allCardsArray: AnyCard[] = await VQL.execute("card card") as any;
if ("err" in allCardsArray) throw new Error(JSON.stringify(allCardsArray));

export const allCardMap = Object.fromEntries(allCardsArray.map(card => [card._id, card]));
