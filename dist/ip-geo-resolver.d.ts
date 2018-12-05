import * as mongoose from 'mongoose';
declare type GeoIpData = {
    as: string;
    city: string;
    country: string;
    countryCode: string;
    isp: string;
    lat: number;
    lon: number;
    org: string;
    query: string;
    region: string;
    regionName: string;
    status: string;
    timezone: string;
    zip: string;
};
export declare class IpGeoResolver {
    connectionString: string;
    dbName: string;
    private connectionPromise;
    private geoIpModel;
    getConnectionPromise(): Promise<typeof mongoose>;
    private saveToDb;
    private static detectMorganEntryIp;
    augmentWithGeo(morganEntry: any): Promise<any>;
    resolveIp(ip: string): Promise<GeoIpData>;
}
export {};
