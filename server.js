var express = require('express'),
    hbs     = require('express-hbs'),
    logger  = require('morgan'),
    app     = express();

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

app.get('/', function (req, res) {
    res.render('index');
});

app.listen(app.get('port'), function () {
    console.log('wikipedia-edits started on ' + app.get('port'));
});
