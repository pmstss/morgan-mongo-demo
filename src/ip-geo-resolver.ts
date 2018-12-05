import * as mongoose from 'mongoose';
import * as request from 'request';
const isLocalIp = require('is-local-ip');

const geoIpDataSchemaDef = {
    as: mongoose.Schema.Types.String,
    city: mongoose.Schema.Types.String,
    country: mongoose.Schema.Types.String,
    countryCode: mongoose.Schema.Types.String,
    isp: mongoose.Schema.Types.String,
    lat: mongoose.Schema.Types.Number,
    lon: mongoose.Schema.Types.Number,
    org: mongoose.Schema.Types.String,
    query: mongoose.Schema.Types.String,
    region: mongoose.Schema.Types.String,
    regionName: mongoose.Schema.Types.String,
    status: mongoose.Schema.Types.String,
    timezone: mongoose.Schema.Types.String,
    zip: mongoose.Schema.Types.String
};

type GeoIpData = {
    as: string,
    city: string,
    country: string,
    countryCode: string,
    isp: string,
    lat: number,
    lon: number,
    org: string,
    query: string,
    region: string,
    regionName: string,
    status: string,
    timezone: string,
    zip: string,
};

export class IpGeoResolver {
    connectionString = process.env.MONGO_MORGAN_URI || 'mongodb://localhost:27017/morgan-mongo';
    dbName = process.env.MONGO_MORGAN_DB || 'morgan-mongo';

    private connectionPromise: Promise<mongoose.Mongoose>;
    private geoIpModel: mongoose.Model<any>;

    getConnectionPromise() {
        if (!this.connectionPromise) {
            this.connectionPromise = mongoose.connect(this.connectionString, {
                dbName: this.dbName,
                useNewUrlParser: true
            }).then((res) => {
                const schema = new mongoose.Schema(geoIpDataSchemaDef, {
                    collection: process.env.MONGO_MORGAN_COLLECTION_GEO || 'geo'
                });
                this.geoIpModel = mongoose.model('GeoIp', schema);
                return res;
            });
        }

        return this.connectionPromise;
    }

    private saveToDb(geoIpData: GeoIpData) {
        const geoIpEntry: mongoose.Document = new this.geoIpModel(geoIpData);
        return geoIpEntry.save((err: any) => {
            if (err) {
                console.error('Error saving geo ip data', err);
            }
        });
    }

    private static detectMorganEntryIp(morganEntry: any) {
        if (morganEntry.forwardAddr && !isLocalIp(morganEntry.forwardAddr)) {
            return morganEntry.forwardAddr;
        }
        if (morganEntry.remoteAddr && !isLocalIp(morganEntry.remoteAddr)) {
            return morganEntry.remoteAddr;
        }
        return null;
    }

    augmentWithGeo(morganEntry: any): Promise<any> {
        const ip = IpGeoResolver.detectMorganEntryIp(morganEntry);
        return (ip ? this.resolveIp(ip) : Promise.resolve(<GeoIpData><any>{ local: true }))
            .then((res) => {
                morganEntry.geo = res;
                return morganEntry;
            }).catch((err) => {
                console.error('IP resolving error: %o', err);
                return morganEntry;
            });
    }

    resolveIp(ip: string): Promise<GeoIpData> {
        return this.getConnectionPromise().catch((e) => {
            console.error('Connection error: ', e);
            process.exit(1);
        }).then(() => {
            return new Promise<GeoIpData>((resolve, reject) => {
                return this.geoIpModel.find({ query: ip }, (err, docs) => {
                    if (docs.length > 0) {
                        resolve(docs[0].toJSON());
                    } else {
                        console.log('ip %s is not found in db', ip);
                        request(`http://ip-api.com/json/${ip}`, (error, response, body) => {
                            if (!response || response.statusCode >= 400) {
                                reject(error);
                                return;
                            }

                            const geoIpData = JSON.parse(body);
                            resolve(geoIpData);
                            this.saveToDb(geoIpData);
                        });
                    }
                });
            });
        });
    }
}
