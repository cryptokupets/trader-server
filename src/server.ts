import { odata, ODataServer } from "odata-v4-server";
import { SessionController } from "./controllers/Session";

@odata.cors
@odata.namespace("Trader")
@odata.controller(SessionController, true)
export class TraderServer extends ODataServer {}
