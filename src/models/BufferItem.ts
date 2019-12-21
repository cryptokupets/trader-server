import { Edm } from "odata-v4-server";
import { Candle } from "./Candle";
import { Indicator } from "./Indicator";

export class BufferItem {
  @Edm.EntityType(Edm.ForwardRef(() => Candle))
  public Candle: Candle;

  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Indicator)))
  public Indicators: Indicator[];

  constructor(data: any) {
    Object.assign(this, data);
  }
}
