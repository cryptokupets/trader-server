import es from "event-stream";
import { streamBuffer } from "get-advice";
import moment from "moment";
import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { Edm, odata, ODataController, ODataQuery } from "odata-v4-server";
import { streamTradesBacktest, streamTradesPaper } from "trader-service";
import connect from "../connect";
import { Candle } from "../models/Candle";
import { Chart } from "../models/Chart";
import { Series } from "../models/Series";
import { SeriesItem } from "../models/SeriesItem";
import { Session } from "../models/Session";
import { Trade } from "../models/Trade";
import { View } from "../models/View";

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

const collectionName = "session";

@odata.type(Session)
@Edm.EntitySet("Session")
export class SessionController extends ODataController {
  @odata.GET
  public async get(@odata.query query: ODataQuery): Promise<Session[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);

    if (mongodbQuery.query._id) {
      mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    }

    const result: Session[] & { inlinecount?: number } =
      typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0
        ? []
        : await db
            .collection(collectionName)
            .find(mongodbQuery.query)
            .project(mongodbQuery.projection)
            .skip(mongodbQuery.skip || 0)
            .limit(mongodbQuery.limit || 0)
            .sort(mongodbQuery.sort)
            .map(e => new Session(e))
            .toArray();

    if (mongodbQuery.inlinecount) {
      result.inlinecount = await db
        .collection(collectionName)
        .find(mongodbQuery.query)
        .project(mongodbQuery.projection)
        .count(false);
    }
    return result;
  }

  @odata.GET
  public async getById(
    @odata.key key: string,
    @odata.query query: ODataQuery
  ): Promise<Session> {
    const { projection } = createQuery(query);
    // tslint:disable-next-line: variable-name
    const _id = new ObjectID(key);
    const db = await connect();
    return new Session(
      await db.collection(collectionName).findOne({ _id }, { projection })
    );
  }

  @odata.POST
  public async post(
    @odata.body
    body: any
  ): Promise<Session> {
    const session = new Session(body);

    const db = await connect();
    const collection = await db.collection(collectionName);
    session._id = (await collection.insertOne(session)).insertedId;

    const {
      _id,
      type,
      asset,
      currency,
      exchange,
      period,
      begin,
      end,
      indicators,
      code,
      initialBalance
    } = session;

    if (type === "backtest") {
      const rs = streamTradesBacktest({
        exchange,
        currency,
        asset,
        period,
        start: begin,
        end,
        indicators: JSON.parse(indicators),
        code,
        initialBalance
      });

      let finalBalance: number;
      const tradesCollection = await db.collection("trade");

      rs.pipe(
        es.map((chunk: any, next: any) => {
          const doc: { amount: number; parentId?: ObjectID } = JSON.parse(
            chunk
          );
          doc.parentId = _id;
          finalBalance = doc.amount;
          tradesCollection.insertOne(doc, next);
        })
      );

      await new Promise(resolve => {
        rs.on("end", resolve);
      });

      finalBalance = Math.abs(finalBalance);

      await collection.updateOne(
        { _id },
        {
          $set: {
            finalBalance,
            profit: finalBalance - initialBalance
          }
        }
      );
    } else if (type === "paper") {
      const stream = streamTradesPaper({
        exchange,
        currency,
        asset,
        period: "" + period,
        start: moment()
          .utc()
          .toISOString(),
        indicators: JSON.parse(indicators),
        code,
        initialBalance
      });

      stream.pipe(
        es.map(async (chunk: any, next: any) => {
          const doc: { amount: number; parentId?: ObjectID } = JSON.parse(
            chunk
          );
          doc.parentId = _id;
          const tradesCollection = await db.collection("trade"); // UNDONE можно ли подсократить?
          await tradesCollection.insertOne(doc, next);
          await collection.updateOne(
            { _id },
            {
              $set: {
                finalBalance: Math.abs(doc.amount),
                profit: Math.abs(doc.amount) - initialBalance
              }
            }
          );
        })
      );

      Session.streams[_id.toHexString()] = stream;
    }

    return session;
  }

  @odata.DELETE
  public async remove(@odata.key key: string): Promise<number> {
    // tslint:disable-next-line: variable-name
    const _id = new ObjectID(key);
    return (await connect())
      .collection(collectionName)
      .deleteOne({ _id })
      .then(result => result.deletedCount);
  }

  @odata.GET("Trades")
  public async getTrades(
    @odata.result result: Session,
    @odata.query query: ODataQuery
  ): Promise<Trade[]> {
    const db = await connect();
    const collection = db.collection("trade");
    const mongodbQuery = createQuery(query);
    const parentId = new ObjectID(result._id);
    const trades: any =
      typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0
        ? []
        : await collection
            .find({ $and: [{ parentId }, mongodbQuery.query] })
            .project(mongodbQuery.projection)
            .skip(mongodbQuery.skip || 0)
            .limit(mongodbQuery.limit || 0)
            .sort(mongodbQuery.sort)
            .toArray();
    if (mongodbQuery.inlinecount) {
      trades.inlinecount = await collection
        .find({ $and: [{ parentId }, mongodbQuery.query] })
        .project(mongodbQuery.projection)
        .count(false);
    }
    return trades;
  }

  @odata.GET("View")
  public async getView(@odata.result result: Session): Promise<View> {
    // tslint:disable-next-line: variable-name
    const _id = new ObjectID(result._id);
    const db = await connect();
    const {
      exchange,
      currency,
      asset,
      period,
      begin,
      end,
      indicators
    }: {
      exchange: string;
      currency: string;
      asset: string;
      period: number;
      begin?: string;
      end?: string;
      indicators: string;
    } = await db.collection(collectionName).findOne({ _id });

    const candles: Candle[] = [];

    // const indicatorCharts: Chart[] = [
    //   new Chart({
    //     sessionId: _id,
    //     index: 0,
    //     Series: [
    //       new Series({
    //         sessionId: _id,
    //         chartIndex: 0,
    //         index: 0,
    //         Items: []
    //       })
    //     ]
    //   })
    // ];

    const parsedIndicators: IIndicator[] = JSON.parse(indicators);

    const rs = streamBuffer({
      exchange,
      currency,
      asset,
      period,
      start: begin,
      end,
      indicators: parsedIndicators
    });

    rs.pipe(
      es.map((chunk: string, next: () => void) => {
        const buffer = JSON.parse(chunk) as IBuffer;
        const {
          time,
          open,
          high,
          low,
          close,
          volume
        } = buffer.candle as ICandle;
        candles.push(
          new Candle({
            time,
            open,
            high,
            low,
            close,
            volume
          })
        );
        // UNDONE сделать диаграммы для индикаторов
        next();
      })
    );

    return new Promise(resolve => {
      rs.on("end", () => {
        resolve(
          new View({
            Candles: candles,
            Indicators: []
          })
        );
      });
    });
  }
}
