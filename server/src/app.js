global.Promise = require('bluebird');

const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./logger');

const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const swagger = require('feathers-swagger');

const services = require('./services');
const appHooks = require('./app.hooks');
const sheetsAdapter = require('./sheetsAdapter');

const app = express(feathers());

app.configure(configuration());

app.use(helmet());  
app.use(cors());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
app.use('/', express.static(app.get('public')));

app.configure(sheetsAdapter);

app.configure(express.rest());

app.configure(swagger({
  docsPath: '/swagger',
  uiIndex: path.join(__dirname, 'docs.html'),
  info: {
    title: 'SBK Scheduler',
    description: 'Terms, Shifts, Members'
  }
}));

app.configure(services);

app.use(express.notFound());
app.use(express.errorHandler({ logger }));

app.hooks(appHooks);

module.exports = app;