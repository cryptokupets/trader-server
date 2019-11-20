import { Edm } from "odata-v4-server";

export class Indicator {
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

  @Edm.Key
  @Edm.String
  public name: string;

  @Edm.Key
  @Edm.String
  public options: string;

  @Edm.Collection(Edm.Double)
  public output: number[];

  constructor(data: any) {
    Object.assign(this, data);
  }
}
