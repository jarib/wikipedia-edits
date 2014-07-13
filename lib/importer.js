var through2 = require('through2'),
    combine  = require('stream-combiner2'),
    client   = require('./es-client');

var cleaner = through2.obj(function (chunk, enc, cb) {
    // we don't save extra properties

    this.push({
        revision_id: chunk.revision_id,
        title: chunk.title,
        page_id: chunk.page_id,
        contributor_ip: chunk.contributor_ip,
        timestamp: chunk.timestamp
    });

    cb();
});

var bulker = function (indexName, max) {
    var buffer = [];

    var write = function (stream, cb) {
        if (buffer.length) {
            stream.push(buffer);
            buffer = [];
        }

        return cb();
    };

    var transform = function (chunk, enc, cb) {
        buffer.push({index: {_index: indexName, _type: 'revision', _id: chunk.revision_id}});
        buffer.push(chunk);

        if (buffer.length === max) {
            return write(this, cb);
        } else {
            return cb();
        }
    };

    var flush = function (cb) { return write(this, cb);  };

    return through2.obj(transform, flush);
};

var writer = function (indexName) {
    return through2.obj(function (chunk, enc, cb) {
        client.bulk({body: chunk}, function (err, res) {
            if (err) { throw err; }
            return cb();
        });
    });
};

module.exports = {
    import: function (indexName) {
        console.log("importing data to " + indexName);
        return combine(cleaner, bulker(indexName, 1024), writer(indexName));
    }
};


