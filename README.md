# morgan-mongo-demo
[![Build Status](https://travis-ci.com/pmstss/morgan-mongo-demo.svg?branch=master)](https://travis-ci.com/pmstss/morgan-mongo-demo) [![Known Vulnerabilities](https://snyk.io/test/github/pmstss/morgan-mongo/badge.svg?targetFile=package.json)](https://snyk.io/test/github/pmstss/morgan-mongo-demo?targetFile=package.json)

Demo server for [morgan-mongo middleware](https://github.com/pmstss/morgan-mongo) with additional geo-ip functionality.

[Live Demo](https://morgan-mongo-demo.herokuapp.com)

### Local deployment
    git clone https://github.com/pmstss/morgan-mongo-demo
    cd morgan-mongo-demo
    npm install
    npm run start

After that server should be accessible by default at http://localhost:3000 (port can be changed in sources or via environment variable `PORT`).
It will records parsed morgan entries (request and response meta) into local mongo instance with default parameters:
* connection string: `mongodb://localhost:27017/morgan-mongo`; env var to override: `MONGO_MORGAN_URI`
* database name: `morgan-mongo` (env `MONGO_MORGAN_DB`)
* collection name: `request-logs` (env `MONGO_MORGAN_COLLECTION`)
* geo data collection name: `geoip` (env `MONGO_MORGAN_COLLECTION_GEO`)

Sample output of geo data:
<details>
<summary>Expand</summary>

```json
{
    "as" : "AS15169 Google LLC",
    "city" : "Mountain View",
    "country" : "United States",
    "countryCode" : "US",
    "isp" : "Level 3 Communications",
    "lat" : 37.4229,
    "lon" : -122.085,
    "org" : "Google Inc.",
    "query" : "8.8.8.8",
    "region" : "CA",
    "regionName" : "California",
    "status" : "success",
    "timezone" : "America/Los_Angeles",
    "zip" : "94043"
}
```

</details>


Note: local ips are filtered with [is-local-ip](https://github.com/DylanPiercey/is-local-ip) library, geo data for them will contain only `local: true` flag.

It will records geo-ip data to local mongo (with default connection string mongodb://localhost:27017/morgan-mongo) into geoip collection (can be tuned either in sources or by setting environment variables).
   
### Credits
* [ip-api](http://ip-api.com/) - IP Geolocation API service   
   
### Contribution
Feel free to contribute by opening issues with any questions, bug reports or feature requests.

### License
  [MIT](LICENSE)
