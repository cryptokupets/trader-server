import { Edm } from "odata-v4-server";
import { Series } from "./Series";

export class Chart {
  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Series)))
  public Series: Series[];

  constructor(data: any) {
    Object.assign(this, data);
  }
}
