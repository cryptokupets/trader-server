import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import { Buffer } from "./Buffer";
import { Trade } from "./Trade";

export class Session {
  public static streams: any = {};

  @Edm.Key
  @Edm.Computed
  @Edm.String
  // tslint:disable-next-line: variable-name
  public _id: ObjectID;

  @Edm.Boolean
  public backtest: boolean;

  @Edm.String
  public exchange: string;

  @Edm.String
  public currency: string;

  @Edm.String
  public asset: string;

  @Edm.Double
  public period: number;

  @Edm.String
  public begin: string;

  @Edm.String
  public end: string;

  @Edm.String
  public indicators: string;

  @Edm.String
  public code: string;

  @Edm.Double
  public initialBalance: number;

  @Edm.Double
  public finalBalance: number;

  @Edm.Double
  public profit: number;

  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Buffer)))
  public Buffer: Buffer[];

  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Trade)))
  public Trades: Trade[];

  constructor(data: any) {
    Object.assign(this, data);
  }

  @Edm.Action
  public stop(@odata.result result: any) {
    const { key } = result;
    if (Session.streams[key]) {
      Session.streams[key].destroy();
    }
  }
}
