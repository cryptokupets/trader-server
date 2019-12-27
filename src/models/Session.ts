import moment from "moment";
import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import connect from "../connect";
import { BufferItem } from "./BufferItem";
import { Trade } from "./Trade";
import { View } from "./View";

export class Session {
  public static streams: any = {};

  @Edm.Key
  @Edm.Computed
  @Edm.String
  // tslint:disable-next-line: variable-name
  public _id: ObjectID;

  @Edm.String
  public type: string; // "backtest"|"paper"|""

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

  @Edm.String
  public status: string; // "active"|"inactive"

  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => BufferItem)))
  public Buffer: BufferItem[];

  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Trade)))
  public Trades: Trade[];

  @Edm.EntityType(Edm.ForwardRef(() => View))
  public View: View;

  constructor(data: any) {
    Object.assign(this, data);
  }

  @Edm.Action
  public async stop(@odata.result result: any): Promise<void> {
    const { _id } = result;
    if (Session.streams[_id]) {
      Session.streams[_id].destroy();
      delete Session.streams[_id];
    }

    await (await connect()).collection("session").updateOne(
      { _id: new ObjectID(_id) },
      {
        $set: {
          end: moment()
            .utc()
            .toISOString()
        }
      }
    );
  }
}
