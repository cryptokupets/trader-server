import { odata, ODataServer } from "odata-v4-server";
import { BacktestController } from "./controllers/Backtest";
import { PaperTradeController } from "./controllers/PaperTrade";

@odata.cors
@odata.namespace("Trader")
@odata.controller(BacktestController, true)
@odata.controller(PaperTradeController, true)
export class TraderServer extends ODataServer {}
