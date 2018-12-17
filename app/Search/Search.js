'use strict';

angular.module('myApp.Search', ['ngRoute', 'ngCookies', 'myApp.FlowdockAuthService', 'myApp.UserUtil']).
controller('SearchCtrl', ['$scope', '$cookies', '$location', '$http', '$filter', 'FlowdockAuthService', 'UserUtil',
  function($scope, $cookies, $location, $http, $filter, authService, userUtil) {
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
      return userUtil.findUser(userID);
    };

    $scope.findUserAvatar = function(userID) {
      return userUtil.findUserAvatar(userID);
    };

    $scope.findUserNick = function(userID) {
      return userUtil.findUserNick(userID);
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
    };

    $scope.linkForMessage = function(message) {
      if (message == null || message == undefined || $scope.flowToSearch == null) {
        return '';
      }
      var url = "https://www.flowdock.com/app/:organization/:flow/threads/:thread";
      url = url.replace(':organization', $scope.flowToSearch.organization.parameterized_name);
      url = url.replace(':flow', $scope.flowToSearch.parameterized_name);
      url = url.replace(':thread', message.thread_id);
      return url;
    };
  }
]);
