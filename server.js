'use strict';

const express = require('express');
const request = require('request');
const fs = require('fs');
const path = require('path');
const log = require('console-log-level')({
  prefix: function (level) {
    return new Date().toISOString() + ' - ' + level.toUpperCase() + ' - '
  },
  level: 'info'// TODO: Get from environment variable for docker
});
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const simpleOauthModule = require('simple-oauth2');

const port = 3000;

const app = express();
app.use(cookieParser());
app.use(bodyParser());

app.listen(port, () => {
  log.info(`Server started and listening on port ${port}!`);
});

let oauth_settings = {};
// Read in oauth settings from either environment variables (docker) or settings file
// TODO: Get from environment variables first (for docker support)
oauth_settings = JSON.parse(fs.readFileSync('./config/oauth_settings.json', 'utf8'));

const flowUriHost = 'https://api.flowdock.com';
const BASE_PATH = '/notifier';
const BASE_PATH_API = `${BASE_PATH}/api`;

// Let files be served from the public directory
app.use(`${BASE_PATH}/app`, express.static(path.join(__dirname, './app')));
app.use(BASE_PATH, express.static(path.join(__dirname, './app')));

const oauth2 = simpleOauthModule.create({
  client: {
    id: oauth_settings.client_id,
    secret: oauth_settings.client_secret,
  },
  auth: {
    tokenHost: flowUriHost,
    tokenPath: '/oauth/token',
    authorizePath: '/oauth/authorize',
  },
});

// Authorization uri definition
const authorizationUri = oauth2.authorizationCode.authorizeURL({
  redirect_uri: oauth_settings.redirect_uri,
  scope: 'flow private',
  state: Math.random(),
});

// Initial page redirecting to auth
app.get(`${BASE_PATH_API}/auth`, (req, res) => {
  // res.send('hello');
  const tokenCookie = req.cookies['token_obj'];
  if(tokenCookie !== undefined && tokenCookie !== null) {
    let accessToken = {};
    try {
      accessToken = oauth2.accessToken.create(tokenCookie);
    } catch(e) {
      log.error(`It appears we have caught an error while creating ` +
        `the token. Redirecting to ${oauth_settings.redirect_uri}`)
        res.redirect(authorizationUri);
        return;
    }

    // Test if the token is expired
    if( accessToken.expired() ) {
      log.debug('Token is expired');
      accessToken.refresh().then((result) => {
        accessToken = result;
        res.cookie('token_obj', result, {httpOnly: false});
        return res.redirect(BASE_PATH + '/app');
      }).catch((error) => {
        log.error('An error occurred while attempting to refresh the token. Having user re-auth. Error: ', error);
        res.redirect(authorizationUri);
      });
    }else {
      // Test that user can still access with this access_token.
      const reqUri = flowUriHost + '/organizations?access_token=' + tokenCookie.access_token;
      request.get(reqUri, function(error, resp, body) {
        const messageFromBody = JSON.parse(body).message;
        if(messageFromBody !== undefined) {
          log.debug('Not authorized!');
          res.redirect(authorizationUri);
        }else {
          return res.redirect(BASE_PATH + '/app');
        }
      });
    }

  }else {
    log.debug('Cookie tokenCookie was null or doesn\'t exist thus not authorized!');
    res.redirect(authorizationUri);
  }

});

function retrieveToken(req, res, code) {
  const options = {
    client_id: oauth_settings.client_id,
    client_secret: oauth_settings.client_secret,
    code: code,
    redirect_uri: oauth_settings.redirect_uri
  };
  oauth2.authorizationCode.getToken(options, (error, result) => {
    try {
      if (error) {
        log.error('Access Token Error', error.message);
        return res.json('Authentication failed');
      }
      res.cookie('token_obj', result, {httpOnly: false});
      log.debug('getToken() result: ', result);
      return res.redirect(BASE_PATH + '/app');
    }catch(e) {
      log.error('Something bad happened', e);
      return res.status(500);
    }
  });
}

// Callback service parsing the authorization token and asking for the access token
app.get(`${BASE_PATH_API}/callback`, (req, res) => {
  const code = req.query.code;
  retrieveToken(req, res, code);
});

app.get(`${BASE_PATH_API}/FlowdockProxy`, (req, res) => {
  const proxy = req.query.proxy;
  if( !proxy.startsWith('https://api.flowdock.com/') ) {
    return res.status(400).json('Only flowdock api is acceptable to proxy');
  }else {
    // Clone req.query so that we can delete properties without causing problems
    let queryWithoutProxy = Object.assign({}, req.query);
    delete queryWithoutProxy.proxy;

    request.get({
      url: proxy,
      qs: queryWithoutProxy
    }, function(error, resp, body) {
      if(error) {
        log.error('An error occurred while proxying Flowdock request. Error: ', error);
        return res.status(500).json(error);
      }else {
        // Check if we need to re-auth again; if so, redirect to /notifier/api/auth
        log.debug('body: ' + body);
        const messageFromBody = JSON.parse(body).message;
        log.debug('messageFromBody: ' + messageFromBody);
        if(messageFromBody !== undefined) {
          return res.status(500).json('Requires re-auth');
        }
        return res.status(200).send(body);
      }
    });
  }
});

app.get(`${BASE_PATH_API}/get/user`, (req, res) => {
  const proxy = req.query.proxy;
  log.debug('proxy: ', proxy);

  if( !proxy.startsWith('https://api.flowdock.com/') ) {
    let returnMsg = 'Only flowdock api is acceptable to proxy';
    log.error(msg);
    return res.status(400).json(returnMsg);
  }else {
    log.debug('Fetching user from flowdock');
    // Clone req.query so that we can delete properties without causing problems
    let queryWithoutProxy = Object.assign({}, req.query);
    delete queryWithoutProxy.proxy;

    request.get({
      url: proxy,
      qs: queryWithoutProxy
    }, function(error, resp, body) {
      if(error) {
        log.error('An error occurred while proxying Flowdock request. Error: ', error);
        return res.status(500).json(error);
      }else {
        // Check if we need to re-auth again; if so, redirect to /notifier/api/auth
        log.debug('body: ' + body);
        const messageFromBody = JSON.parse(body).message;
        log.debug('messageFromBody: ' + messageFromBody);
        if(messageFromBody !== undefined && messageFromBody !== 'Access denied') {
          return res.status(500).json('Requires re-auth');
        }
        const userObj = JSON.parse(body);
        // return the body regardless of what is in it.
        return res.status(200).send(body);
      }
    });
  }
});

app.get(BASE_PATH + '/', (req, res) => {
  res.redirect(`${BASE_PATH_API}/auth`);
});

app.get('/', (req, res) => {
  res.redirect(`${BASE_PATH_API}/auth`);
});
