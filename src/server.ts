import es from "event-stream";
import { Edm, odata, ODataServer } from "odata-v4-server";
import { streamBuffer } from "trader-service";
import { SessionController } from "./controllers/Session";

interface ICandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IIndicator {
  name: string;
  options: number[];
}

interface IBuffer {
  candle: ICandle;
  indicators: number[][];
}

@odata.cors
@odata.namespace("Trader")
@odata.controller(SessionController, true)
export class TraderServer extends ODataServer {
  @Edm.FunctionImport(Edm.String)
  public async getData(@odata.body body: any): Promise<IBuffer[]> {
    const {
      exchange,
      currency,
      asset,
      period,
      begin,
      end
    }: {
      exchange: string;
      currency: string;
      asset: string;
      period: number;
      begin?: string;
      end?: string;
    } = body;

    const indicators: IIndicator[] = JSON.parse(body.indicators);

    const rs = streamBuffer({
      exchange,
      currency,
      asset,
      period,
      start: begin,
      end,
      indicators
    });

    const buffer: IBuffer[] = [];

    rs.pipe(
      es.map((chunk: string, next: () => void) => {
        buffer.push(JSON.parse(chunk) as IBuffer);
        next();
      })
    );

    return new Promise(resolve => {
      rs.on("end", () => {
        resolve(buffer);
      });
    });
  }
}
