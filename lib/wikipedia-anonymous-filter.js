var through = require('through2');

module.exports = through.obj(function (chunk, enc, cb) {
    // we only want anonymous edits
    if (chunk.contributor_ip) {
        delete chunk.contributor_username;
        this.push(chunk);
    }

    if (isNaN(chunk.timestamp)) {
        console.error("bad timestamp " + JSON.stringify(chunk));
    }

    cb();
});