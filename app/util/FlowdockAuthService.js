/**
 * Created by Anthony on 1/11/2017.
 */
'use strict';

angular.module('myApp.FlowdockAuthService', ['myApp.DateUtil']).
service('FlowdockAuthService', ['$http', '$cookies', 'DateUtil', function($http, $cookies, DateUtil) {
  var serviceRoot = this;
  var client_id = '';
  var client_secret = '';
  var client_redirect_uri_encoded = '';
  var redirect_url = '';

  this.ListOfFlows = [];
  this.ListOfUsers = [];
  this.userToken = ($cookies.get('userToken') !== null && $cookies.get('userToken') !== undefined) ?
    $cookies.get('userToken') : undefined;
  this.access_token = ($cookies.get('access_token') !== null && $cookies.get('access_token') !== undefined) ?
    $cookies.get('access_token') : undefined;
  this.refresh_token = ($cookies.get('refresh_token') !== null && $cookies.get('refresh_token') !== undefined) ?
    $cookies.get('refresh_token') : undefined;
  this.created_at = ($cookies.get('created_at') !== null && $cookies.get('created_at') !== undefined) ?
    $cookies.get('created_at') : undefined;
  this.expires_in = ($cookies.get('expires_in') !== null && $cookies.get('expires_in') !== undefined) ?
    $cookies.get('expires_in') : undefined;

  function clearOutQuery() {
    if(window.location.search !== undefined && window.location.search.length > 0) {
      console.log('clearing out query string by refreshing page. Current URL: ' + window.location.href);
      setTimeout(function() {
        window.location.href = window.location.href.split("?")[0];
      }, 1500);
    }
  }

  function authenticateWithFlowdock() {
    // Redirect to get token from Flowdock
    window.location = 'https://www.flowdock.com/oauth/authorize?client_id=' + client_id +
      '&redirect_uri=' + client_redirect_uri_encoded + '&response_type=code';
  }

  // Taken from http://stackoverflow.com/a/901144 since the angular $location.search()
  // seems to be having problems with the query appearing before the hash.
  function getParameterByName(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) {
      return null;
    }
    if (!results[2]) {
      return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  this.refreshFlowNames = function() {
    // Get Flow Names
    $http({
      method: 'GET',
      // dataType: 'json',
      headers: { 'Content-Type': 'application/json' },
      url: location.protocol + '//' + location.hostname + location.port +
      '/notifier/getFlowNames.php?access_token=' + this.access_token
    }).then(function success(response) {
      serviceRoot.ListOfFlows = [];
      var flows = response.data;
      if(Array.isArray(flows)) {
        for(var i = 0, len = flows.length; i < len; i++) {
          serviceRoot.ListOfFlows.push({
            id: flows[i].id,
            name: flows[i].name,
            parameterized_name: flows[i].parameterized_name,
            description: flows[i].description,
            organization: flows[i].organization,
            requireNotificationInteraction: false
          });
        }
      }else {
        console.log('flows was not an array!');
        throw 'Data coming back from flows request was not an array like expected!';
      }

    }, function error(response){
      console.error('An error has occurred retrieving flow names. See below.');
      console.error(response);
    });
  };

  this.refreshUserList = function() {
    // Get Flowdock users list
    $http({
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      url: 'https://api.flowdock.com/users?access_token=' + this.access_token
    }).then(function success(response) {
      serviceRoot.ListOfUsers = [];
      var users = response.data;
      if(Array.isArray(users)) {
        for(var i = 0, len = users.length; i < len; i++) {
          serviceRoot.ListOfUsers.push({
            id: users[i].id,
            nick: users[i].nick,
            email: users[i].email,
            avatar: users[i].avatar,
            name: users[i].name,
            website: users[i].website
          });
        }
      }else {
        console.log('User list was not an array!');
        throw 'Data coming back from users request was not an array like expected!';
      }

    }, function error(response){
      console.error('An error has occurred retrieving user list. See below.');
      console.error(response);
    });
  };

  this.getTokensAndFinishSettingUpService = function() {
    var code = getParameterByName('code');
    var access_token = getParameterByName('access_token');
    if(code != null) {
      serviceRoot.userToken = code;
      $cookies.put('userToken', serviceRoot.userToken, { path: '/', expires: DateUtil.oneMonthFromToday() } );
      clearOutQuery();
      return;
    }else if(access_token != null) {
      serviceRoot.access_token = access_token;
      $cookies.put('access_token', serviceRoot.access_token, { path: '/', expires: DateUtil.oneMonthFromToday() } );
      $location.search('code', null);
      clearOutQuery();
      return;
    }else if(serviceRoot.userToken !== undefined) {
      // Do nothing since it is already stored in our cookie
    }else {
      authenticateWithFlowdock();
      return;
    }
    // Ask for Flowdock for access_token if local access_token is undefined. Only do so if userToken isn't empty as well.
    if(serviceRoot.userToken !== undefined && serviceRoot.userToken !== null && serviceRoot.access_token === undefined) {
      console.log('getting access_token');
      $http({
        method: 'POST',
        crossOrigin: true,
        headers: {
          'Content-Type': 'application/json'
        },
        url: location.protocol + '//' + location.hostname + location.port + '/notifier/getAccessToken.php',
        data: {
          client_id: client_id,
          client_secret: client_secret,
          code: serviceRoot.userToken,
          redirect_uri: redirect_url,
          grant_type: 'authorization_code',
          provider: $http
        }
      }).then(function successCallback(response) {
        serviceRoot.access_token = response.data.access_token;
        $cookies.put('access_token', response.data.access_token, { path: '/', expires: DateUtil.oneMonthFromToday() } );

        serviceRoot.refresh_token = response.data.refresh_token;
        $cookies.put('refresh_token', response.data.refresh_token, { path: '/', expires: DateUtil.oneMonthFromToday() } );

        serviceRoot.created_at = new Date(response.data.created_at);
        $cookies.put('created_at', response.data.created_at, { path: '/', expires: DateUtil.oneMonthFromToday() } );

        serviceRoot.expires_in = new Date(response.data.created_at + response.data.expires_in);
        $cookies.put('expires_in', response.data.expires_in, { path: '/', expires: DateUtil.oneMonthFromToday() } );

        serviceRoot.refreshFlowNames();
        serviceRoot.refreshUserList();
      }, function errorCallback(response) {
        console.error('An error occurred! See below:');
        console.error(response);
      });
    }
    // Token may need refreshed; Check to see if our current access token has expired
    else if(serviceRoot.created_at !== undefined && serviceRoot.created_at !== null && serviceRoot.expires_in !== undefined && serviceRoot.expires_in !== null) {
      console.log('Refreshing Token');
      var curDate = new Date();
      if(curDate > serviceRoot.expires_in) {
        $http({
          method: 'POST',
          crossOrigin: true,
          headers: { 'Content-Type': 'application/json' },
          url: location.protocol + '//' + location.hostname + location.port + '/notifier/getAccessToken.php',
          data: {
            refresh_token: serviceRoot.refresh_token,
            client_id: client_id,
            client_secret: client_secret,
            grant_type: 'refresh_token',
            provider: $http,
            ReturnUrl: client_redirect_uri_encoded
          }
        }).then(function successCallback(response) {
          serviceRoot.access_token = response.data.access_token;
          $cookies.put('access_token', response.data.access_token, { path: '/', expires: DateUtil.oneMonthFromToday() } );

          serviceRoot.refresh_token = response.data.refresh_token;
          $cookies.put('refresh_token', response.data.refresh_token, { path: '/', expires: DateUtil.oneMonthFromToday() } );

          serviceRoot.created_at = new Date(response.data.created_at);
          $cookies.put('created_at', response.data.created_at, { path: '/', expires: DateUtil.oneMonthFromToday() } );

          serviceRoot.expires_in = new Date(response.data.created_at + response.data.expires_in);
          $cookies.put('expires_in', response.data.expires_in, { path: '/', expires: DateUtil.oneMonthFromToday() } );

          serviceRoot.refreshFlowNames();
          serviceRoot.refreshUserList();
        }, function errorCallback(response) {
          console.error('An error occurred! See below:');
          console.error(response);
        });
      }else {
        console.log('auto-refreshing flow names and users.');
        serviceRoot.refreshFlowNames();
        serviceRoot.refreshUserList();
      }
    }
  };

  // Get settings from app_settings.json
  ($http.get(location.protocol + '//' + location.hostname + location.port + '/app_settings.json')
      .then(function successCallback(response) {
          client_id = response.data.client_id;
          client_secret = response.data.client_secret;
          redirect_url = response.data.redirect_url;
          client_redirect_uri_encoded = encodeURIComponent(redirect_url);
          serviceRoot.getTokensAndFinishSettingUpService();
        }, function errorCallback(response) {
          console.info('An error occurred! See below:');
          console.info(response);
          throw "Unable to get app_settings.json from server!";
        }
      )
  );
}]);