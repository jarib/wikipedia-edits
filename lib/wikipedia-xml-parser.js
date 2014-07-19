var expat   = require('node-expat'),
    through = require('through2'),
    moment  = require('moment');

var STATES                     = 0,
    STATE_PAGE                 = STATES++,
    STATE_PAGE_ID              = STATES++,
    STATE_PAGE_TITLE           = STATES++,
    STATE_REVISION             = STATES++,
    STATE_REVISION_ID          = STATES++,
    STATE_REVISION_TS          = STATES++,
    STATE_CONTRIBUTOR          = STATES++,
    STATE_CONTRIBUTOR_IP       = STATES++,
    STATE_CONTRIBUTOR_USERNAME = STATES++;

module.exports = function () {
    var currentPage = null,
        currentRevision = null,
        stack   = [],
        parser  = new expat.Parser('utf-8');

    function transform(chunk, enc, cb) {
        parser.write(chunk);
        cb();
    }

    var stream = through.obj(transform);

    //
    // this seems pretty insane, but I can't find a native parser that can be passed to pipe()?!
    //
    parser.on('startElement', function (name, attrs) {
        var lastState = stack[stack.length - 1];

        switch (name) {
        case 'page':
            stack.push(STATE_PAGE);
            currentPage = {};
            break;
        case 'revision':
            stack.push(STATE_REVISION);
            currentRevision = {};
            break;
        case 'contributor':
            stack.push(STATE_CONTRIBUTOR);
            break;
        case 'ip':
            stack.push(lastState === STATE_CONTRIBUTOR ? STATE_CONTRIBUTOR_IP : 0);
            break;
        case 'username':
            stack.push(lastState === STATE_CONTRIBUTOR ? STATE_CONTRIBUTOR_USERNAME : 0);
            break;
        case 'timestamp':
            stack.push(lastState === STATE_REVISION ? STATE_REVISION_TS : 0);
            break;
        case 'id':
            if (lastState === STATE_PAGE) {
                stack.push(STATE_PAGE_ID);
            } else if (lastState === STATE_REVISION) {
                stack.push(STATE_REVISION_ID);
            } else {
                stack.push(0);
            }
            break;
        case 'title':
            if (lastState === STATE_PAGE) {
                stack.push(STATE_PAGE_TITLE);
            } else {
                stack.push(0);
            }
            break;
        default:
            stack.push(0);
            break;
        }
    });

    parser.on('endElement', function (name) {
        stack.pop();

        if (name === 'revision') {
            stream.push({
                title: currentPage.title,
                page_id: +currentPage.id,
                revision_id: +currentRevision.id,
                timestamp: moment(currentRevision.timestamp).unix(),
                contributor_ip: currentRevision.contributor_ip,
                contributor_username: currentRevision.contributor_username
            });
        }
    });

    parser.on('text', function (text) {
        switch (stack[stack.length - 1]) {
        case STATE_PAGE_ID:
            currentPage.id = text;
            break;
        case STATE_PAGE_TITLE:
            currentPage.title = text;
            break;
        case STATE_REVISION_ID:
            currentRevision.id = text;
            break;
        case STATE_REVISION_TS:
            currentRevision.timestamp = text;
            break;
        case STATE_CONTRIBUTOR_IP:
            currentRevision.contributor_ip = text;
            break;
        case STATE_CONTRIBUTOR_USERNAME:
            currentRevision.contributor_username = text;
            break;
        }
    });

    parser.on('error', function (err) {
        throw err;
    });

    return stream;
};