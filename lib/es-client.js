var elasticsearch = require('elasticsearch');

module.exports = new elasticsearch.Client({
    host: process.env.ELASTICSEARCH_URL || process.env.BOXEN_ELASTICSEARCH_URL || 'http://localhost:9200',
    log: 'warning'
});