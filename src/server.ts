import { odata, ODataServer } from "odata-v4-server";
import { PaperTradeController } from "./controllers/PaperTrade";

@odata.cors
@odata.namespace("Trader")
@odata.controller(PaperTradeController, true)
export class TraderServer extends ODataServer {}
