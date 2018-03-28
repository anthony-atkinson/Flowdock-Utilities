'use strict';

angular.module('myApp.Search', ['ngRoute', 'ngAudio', 'ngCookies', 'myApp.FlowdockAuthService']).
controller('SearchCtrl', ['$scope', '$cookies', '$location', '$http', '$filter', 'ngAudio', 'FlowdockAuthService',
  function($scope, $cookies, $location, $http, $filter, ngAudio, authService) {
    var baseProxyUrl = '/notifier/api/FlowdockProxy?proxy=:proxy?event=message,comment,status,file';
    var baseUserObjUrl = '/notifier/api/get/user?proxy=https://api.flowdock.com/private/:id&access_token=:access_token';
    var baseFlowUrl = 'https://api.flowdock.com/flows/:organization/:flow/messages';
    var flowUrlParams = 'search=:search&access_token=:access_token';
    var baseUserUrl = 'https://api.flowdock.com/private/:user/messages';
    var userUrlParams = 'search=:search&access_token=:access_token';

    $scope.searchTerms = '';
    $scope.searchMode = 'flows';
    
    $scope.flowToSearch = null;
    $scope.userIdToSearch = null;

    $scope.ListOfFlows = function() {
      return $filter('orderBy')(authService.ListOfFlows, 'name', false);
    };

    $scope.ListOfUsers = function() {
      return $filter('orderBy')(authService.ListOfUsers, 'nick', false);
    };
    
    $scope.response = null;

    $scope.searchInProgress = false;

    $scope.performSearch = function() {
      $scope.response = null;
      $scope.searchInProgress = true;
      var requestUrl = baseProxyUrl;
      switch($scope.searchMode) {
        case 'flows':
          requestUrl = requestUrl.replace(':proxy', baseFlowUrl);
          requestUrl = requestUrl.replace(':organization', $scope.flowToSearch.organization.parameterized_name);
          requestUrl = requestUrl.replace(':flow', $scope.flowToSearch.parameterized_name);
          requestUrl = requestUrl + '&' + flowUrlParams;
          break;
        case 'users':
          requestUrl = requestUrl.replace(':proxy', baseUserUrl);
          requestUrl = requestUrl.replace(':user', $scope.userIdToSearch);
          requestUrl = requestUrl + '&' + userUrlParams;
          break;
      }
      requestUrl = requestUrl.replace(':search', encodeURIComponent($scope.searchTerms));
      requestUrl = requestUrl.replace(':access_token', authService.access_token);
      $http({
        method: 'GET',
        crossOrigin: true,
        headers: { 'Content-Type': 'text/plain'},
        url: requestUrl
      }).then(function successCallback(resp) {
        $scope.response = resp.data;
        $scope.searchInProgress = false;
      }, function errorCallback(resp) {
        if(resp.status === 500 && resp.data === 'Requires re-auth') {
          location.href = '/notifier/api/auth';
        }else {
          console.log(resp);
          $scope.searchInProgress = false;
        }
      });
    };

    $scope.controllerInit = function() {

    };

    function requestUserObjFromFlowdock(userID) {
      var requestUrl = baseUserObjUrl;
      requestUrl = requestUrl.replace(':id', userID);
      requestUrl = requestUrl.replace(':access_token', authService.access_token);
      $http({
        method: 'GET',
        crossOrigin: true,
        headers: { 'Content-Type': 'text/plain'},
        url: requestUrl
      }).then(function successCallback(resp) {
        var returnUser = resp.data;
        if(returnUser !== undefined && returnUser !== null && returnUser.message === undefined) {
          return returnUser;
        }
        console.log('Something happened while trying to retrieve user');
        return null;
      }, function errorCallback(response) {
        if(response.status === 500 && response.data === 'Requires re-auth') {
          location.href = '/notifier/api/auth';
        }else {
          console.log('An error occurred while trying to retieve user from flowdock. See error:');
          console.log(response);
        }
      });
    }

    $scope.findUser = function(userID) {
      if(userID === null || userID === undefined) {
        return null;
      }
      var userList = $scope.ListOfUsers();
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

    $scope.findUserAvatar = function(userID) {
      var foundUser = $scope.findUser(userID);
      return foundUser !== null ? foundUser.avatar : 'assets/images/base_avatar.png';
    };

    $scope.findUserNick = function(userID) {
      var foundUser = $scope.findUser(userID);
      if(foundUser !== null && foundUser !== undefined) {
        return (foundUser.removed) ? foundUser.nick + ' (Removed)' : foundUser.nick;
      }else {
        return userID + ' (object MIA)';
      }
    };

    $scope.getNiceTime = function(timeInSeconds) {
      var time = new Date(timeInSeconds);
      return time.toString();
    };

    $scope.formattedTagList = function(tags) {
      var tags_clone = tags.slice();
      if(tags_clone.length && tags_clone.length > 1) {
        tags_clone.pop();
        return tags_clone.join(", ");
      }
      return "";
    }
  }
]);