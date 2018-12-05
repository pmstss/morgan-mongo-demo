"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const mongoose = require("mongoose");
const logger = require("morgan");
const morgan_mongo_1 = require("morgan-mongo");
const ip_geo_resolver_1 = require("./ip-geo-resolver");
exports.app = express();
exports.app.set('port', process.env.PORT || 3001);
exports.app.set('json spaces', 4);
exports.app.use(logger('dev'));
exports.app.use(morgan_mongo_1.morganMongoMiddleware({
    connectionString: process.env.MONGO_MORGAN_URI || 'mongodb://localhost:27017/morgan-mongo'
}, {
    dbName: process.env.MONGO_MORGAN_DB || 'morgan-mongo'
}, {
    capped: {
        size: 1024 * 1024,
        max: 5 * 1024
    },
    collection: process.env.MONGO_MORGAN_COLLECTION || 'request-logs'
}));
const ipGeoResolver = new ip_geo_resolver_1.IpGeoResolver();
exports.app.use('/results', (request, response) => {
    if (mongoose.models.Log) {
        mongoose.models.Log.find({}, null, { limit: 10, sort: { _id: -1 } }, (err, docs) => {
            if (err) {
                response.status(500).send(err);
            }
            else {
                response.header('Content-Type', 'application/json');
                const geoDocs = [];
                const sequentialRes = [...docs, null].reduce((promise, doc) => promise.then((geoDoc) => {
                    if (geoDoc) {
                        geoDocs.push(geoDoc);
                    }
                    return doc && ipGeoResolver.augmentWithGeo(doc.toJSON());
                }), Promise.resolve());
                sequentialRes.then(() => response.send(geoDocs));
            }
        });
    }
    else {
        response.redirect('/init');
    }
});
exports.app.use('*', (req, res) => {
    res.header('Content-Type', 'text/html').send('Thank you! Your visit has been recorded. ' +
        '<a href="/results">Have a look at last 10 visits here.</a>');
});
const server = exports.app.listen(exports.app.get('port'), () => {
    const addr = server.address();
    console.log(`Listening on ${addr.port}`);
});
