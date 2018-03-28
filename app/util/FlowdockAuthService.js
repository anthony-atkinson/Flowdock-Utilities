'use strict';

angular.module('myApp.FlowdockAuthService', []).
service('FlowdockAuthService', ['$http', '$cookies', function($http, $cookies) {
  var serviceRoot = this;

  this.ListOfFlows = [];
  this.ListOfUsers = [];
  this.ListOfUsersNotAvailable = [];
  var token_obj = $cookies.get('token_obj');
  if(token_obj !== undefined && token_obj !== null) {
    if(token_obj.startsWith('j:')) {
      token_obj = token_obj.substr(2);
    }
    token_obj = JSON.parse(token_obj);
    
    this.userToken = token_obj.access_token;
    this.access_token = token_obj.access_token;
    this.refresh_token = token_obj.refresh_token;
    this.created_at = token_obj.created_at;
    this.expires_in = token_obj.expires_in;
  }
  // Delete token_obj cookie since we don't need it anymore
  // (and so that the notifier doesn't die randomly)
  $cookies.remove('token_obj', {path:'/'});

  function redirectToAuth() {
    location.href = '/notifier/api/auth';
  }

  this.refreshFlowNames = function() {
    if(this.access_token !== undefined && this.access_token !== null) {
      // Get Flow Names
      $http({
        method: 'GET',
        // dataType: 'json',
        headers: { 'Content-Type': 'application/json' },
        url: 'https://api.flowdock.com/flows?access_token=' + this.access_token
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
          redirectToAuth();
        }

      }, function error(response){
        console.error('An error has occurred retrieving flow names. See below.');
        console.error(response);
        console.log("User isn't authorized. Redirecting to /notifier/api/auth to re-auth");
        redirectToAuth();
      });
    }else {
      console.error('access_token was null or undefined; redirecting to re-auth');
      redirectToAuth();
    }
  };

  this.refreshUserList = function() {
    if(this.access_token !== undefined && this.access_token !== null) {
      var accToken = this.access_token;
      // Get Flowdock users list
      $http({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        url: 'https://api.flowdock.com/users?access_token=' + accToken
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
              website: users[i].website,
              removed: false
            });
          }
          // Get users from /private (since this can include removed users)
          $http({
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            url: 'https://api.flowdock.com/private?access_token=' + accToken
          }).then(function secondSuccess(response2) {
            var privateUsers = response2.data;
            if(Array.isArray(privateUsers)) {
              for(var i = 0, len = privateUsers.length; i < len; i++) {
                var arrayUser2 = privateUsers[i];
                var foundUser = serviceRoot.ListOfUsers.find(function(u) {
                  return arrayUser2.id !== undefined && u.id !== undefined && u.id === arrayUser2.id;
                });
                if(foundUser === null || foundUser === undefined) {
                  var foundMainUserObj = arrayUser2.users.find(function(u) {
                    return arrayUser2.id !== undefined && u.id !== undefined && u.id === arrayUser2.id;
                  });
                  // Use the original arrayUser2 if foundMainUserObj wasn't found.
                  if(foundMainUserObj === null || foundMainUserObj === undefined) {
                    foundMainUserObj = arrayUser2;
                  }
                  serviceRoot.ListOfUsers.push({
                    id: foundMainUserObj.id,
                    nick: foundMainUserObj.nick,
                    email: foundMainUserObj.email,
                    avatar: foundMainUserObj.avatar,
                    name: foundMainUserObj.name,
                    website: foundMainUserObj.website,
                    removed: true
                  });
                }
              }
            }
          }, function secondError(response2) {
            console.error('An error has occurred retrieving user list from /private. See below.');
            console.error(response2);
          })
        }else {
          console.log('User list was not an array!');
          redirectToAuth();
        }
      }, function error(response){
        console.error('An error has occurred retrieving user list from /users. See below.');
        console.error(response);
        console.log("User isn't authorized. Redirecting to /notifier/api/auth to re-auth");
        redirectToAuth();
      });
    }else {
      console.error('access_token was null or undefined; redirecting to re-auth');
      redirectToAuth();
    }
  };

  serviceRoot.refreshFlowNames();
  serviceRoot.refreshUserList();
}]);