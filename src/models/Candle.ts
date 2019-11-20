import { Edm } from "odata-v4-server";

export class Candle {
  @Edm.Key
  @Edm.String
  public exchange: string;

  @Edm.Key
  @Edm.String
  public currency: string;

  @Edm.Key
  @Edm.String
  public asset: string;

  @Edm.Key
  @Edm.Double
  public period: number;

  @Edm.Key
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
