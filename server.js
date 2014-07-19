var express   = require('express'),
    hbs       = require('express-hbs'),
    logger    = require('morgan'),
    es        = require('./lib/es-client'),
    moment    = require('moment'),
    deepmerge = require('deepmerge'),
    app       = express();

app.use(logger('short'));
app.engine('hbs', hbs.express3({
    layoutsDir: __dirname + '/views/_layouts',
    defaultLayout: __dirname + '/views/_layouts/default.hbs',
    partialsDir: __dirname + '/views/_partials'
}));

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.set('port', process.env.HTTP_PORT || 9898);
app.use(express.static(__dirname + '/public'));

function presentHit(hit) {
    var revision = hit._source,
        wiki     = hit._index.split('.')[1],
        m        = moment(revision.timestamp);

    revision.diff_url = 'http://' + wiki + '.wikipedia.org/w/index.php?diff=' + revision.revision_id;
    revision.date = m.format("YYYY-MM-DD HH:mm");

    return revision;
}

function presentSearchResults(body) {
    //console.log(JSON.stringify(body, null, '   '));

    return {
        totalHits: body.hits.total,
        results: body.hits.hits.map(presentHit)
    };
}

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/search', function (req, res) {
    console.log(req.query);

    var q = {
        index: 'wiki.' + req.query.wikipedia,
        body: {
            sort: {'timestamp': 'desc'},
            query: {
                "match" : {"title" : req.query.keyword.trim().length ? req.query.keyword : '*'}
            }
        }
    };

    es.search(q)
        .then(function (body) {
            res.render('results', deepmerge(presentSearchResults(body), {query: req.query}));
        }).catch(function (err) {
            console.error(err, err.stack);
            res.render('error', {error: err});
        });
});

app.listen(app.get('port'), function () {
    console.log('wikipedia-edits started on ' + app.get('port'));
});
