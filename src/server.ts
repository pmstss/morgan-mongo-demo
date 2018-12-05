import * as express from 'express';
import * as mongoose from 'mongoose';
import * as logger from 'morgan';
import { AddressInfo } from 'net';
import { morganMongoMiddleware } from 'morgan-mongo';
import { IpGeoResolver } from './ip-geo-resolver';

export const app = express();
app.set('port', process.env.PORT || 3001);
app.set('json spaces', 4);

app.use(logger('dev'));

app.use(morganMongoMiddleware(
    {
        connectionString: process.env.MONGO_MORGAN_URI || 'mongodb://localhost:27017/morgan-mongo'
    },
    {
        dbName: process.env.MONGO_MORGAN_DB || 'morgan-mongo'
    },
    {
        capped: {
            size: 1024 * 1024,
            max: 5 * 1024
        },
        collection: process.env.MONGO_MORGAN_COLLECTION || 'request-logs'
    }
));

const ipGeoResolver = new IpGeoResolver();
app.use('/results', (request, response) => {
    if (mongoose.models.Log) {
        mongoose.models.Log.find({}, null, { limit: 10, sort: { _id: -1 } }, (err, docs) => {
            if (err) {
                response.status(500).send(err);
            } else {
                response.header('Content-Type', 'application/json');
                const geoDocs: any[] = [];
                const sequentialRes = [...docs, null].reduce(
                    (promise, doc) => promise.then((geoDoc: any) => {
                        if (geoDoc) {
                            geoDocs.push(geoDoc);
                        }
                        return doc && ipGeoResolver.augmentWithGeo(doc.toJSON());
                    }),
                    Promise.resolve()
                );
                sequentialRes.then(() => response.send(geoDocs));
            }
        });
    } else {
        response.redirect('/init');
    }
});

app.use('*', (req, res) => {
    res.header('Content-Type', 'text/html').send('Thank you! Your visit has been recorded. ' +
        '<a href="/results">Have a look at last 10 visits here.</a>');
});

const server = app.listen(app.get('port'), () => {
    const addr = <AddressInfo>server.address();
    console.log(`Listening on ${addr.port}`);
});
