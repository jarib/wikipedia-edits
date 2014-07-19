var request  = require('request'),
    progress = require('request-progress'),
    zlib     = require('zlib'),
    moment   = require('moment');

var DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm";

module.exports = {
    // given a language code, downloads the full revision history and returns a readable stream the uncompressed XML data

    fetch: function (langCode) {
        var dumpUrl = 'http://dumps.wikimedia.org/' + langCode + 'wiki/latest/' + langCode + 'wiki-latest-stub-meta-history.xml.gz',
            req     = progress(request(dumpUrl)),
            start   = moment(),
            startMs = start.valueOf();

        req.on('progress', function (stats) {
            var bytesPerMs       = stats.received / (moment().valueOf() - startMs),
                exptectedTotalMs = stats.total / bytesPerMs,
                eta              = moment(startMs + exptectedTotalMs),
                receivedKb       = Math.round(stats.received / 1024),
                totalKb          = Math.round(stats.total / 1024);

            console.log(moment().format(DATE_TIME_FORMAT + ':ss') + ' | ' +
                        stats.percent + '%,  ' + receivedKb + 'KB / ' + totalKb + 'KB' +
                        ' | ETA: ' + eta.format(DATE_TIME_FORMAT) + ' (' + eta.fromNow() + ')');
        });

        req.on('error', function (err) { throw err; });
        req.on('response', function (res) {
            if (res.statusCode != 200) {
                throw new Error('got status ' + res.statusCode + 'for ' + dumpUrl);
            }
        });

        return req.pipe(zlib.createGunzip());
    }
};