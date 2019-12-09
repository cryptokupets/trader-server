import { Edm } from "odata-v4-server";
import { Candle } from "./Candle";
import { Chart } from "./Chart";

export class View {
  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Candle)))
  public Candles: Candle[];

  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Chart)))
  public Indicators: Chart[];

  constructor(data: any) {
    Object.assign(this, data);
  }
}
