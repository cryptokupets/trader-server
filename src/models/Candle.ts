import { Edm } from "odata-v4-server";

export class Candle {
  @Edm.String
  public time: string;

  @Edm.Double
  public open: number;

  @Edm.Double
  public high: number;

  @Edm.Double
  public low: number;

  @Edm.Double
  public close: number;

  @Edm.Double
  public volume: number;

  constructor(data: any) {
    Object.assign(this, data);
  }
}
