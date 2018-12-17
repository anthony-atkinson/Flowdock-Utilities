'use strict';

angular.module('myApp.UserUtil', ['myApp.FlowdockAuthService']).
service('UserUtil', ['$http', '$cookies', '$filter', 'FlowdockAuthService',
  function($http, $cookies, $filter, authService) {
    var serviceRoot = this;

    this.ListOfUsers = function() {
      return $filter('orderBy')(authService.ListOfUsers, 'nick', false);
    };

    this.findUser = function(userID) {
      if(userID === null || userID === undefined) {
        return null;
      }
      var userList = serviceRoot.ListOfUsers();
      var foundUser = $filter('filter')(userList, {id: parseInt(userID)}, true);
      if(foundUser.length) {
        return foundUser[0]
      }else if(authService.ListOfUsersNotAvailable.indexOf(userID) === -1) {
        // User was probably removed from the organization; lets query for the user manually
        // and add them to the main user list so that we don't have to do this again for this session.
        var retrievedUser = requestUserObjFromFlowdock(userID);
        if(retrievedUser !== null && retrievedUser !== undefined) {
          userList.push(retrievedUser);
          return retrievedUser;
        }else {
          // Add it to the list of not available users so that we don't try
          // to process it again and waste time and network resources.
          authService.ListOfUsersNotAvailable.push(userID);
        }
      }
      return null;
    };

    this.findUserAvatar = function(userID) {
      var foundUser = serviceRoot.findUser(userID);
      return foundUser !== null ? foundUser.avatar : 'assets/images/base_avatar.png';
    };

    this.findUserNick = function(userID) {
      var foundUser = serviceRoot.findUser(userID);
      if(foundUser !== null && foundUser !== undefined) {
        return (foundUser.removed) ? foundUser.nick + ' (Removed)' : foundUser.nick;
      }else {
        return userID + ' (object MIA)';
      }
    };

  }
]);
