'use strict';

angular.module('myApp.Search', ['ngRoute', 'ngAudio', 'ngCookies', 'myApp.FlowdockAuthService']).
controller('SearchCtrl', ['$scope', '$cookies', '$location', '$http', '$filter', 'ngAudio', 'FlowdockAuthService',
  function($scope, $cookies, $location, $http, $filter, ngAudio, authService) {
    //'http://192.168.1.10/backend/FlowdockProxy.php?proxy=https://api.flowdock.com/private/255189/messages&search=hi&access_token=78aaef3e078e6fe90c0dab0f86acd5116291816be4cf577075294066c02f3a45';
    var baseProxyUrl = '/backend/FlowdockProxy.php?proxy=:proxy';
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
        console.log(resp);
        $scope.searchInProgress = false;
      });
    };

    $scope.controllerInit = function() {

    };

    $scope.findUser = function(userID) {
      var userList = $scope.ListOfUsers();
      var foundUser = $filter('filter')(userList, {id: parseInt(userID)}, true);
      if(foundUser.length) {
        return foundUser[0]
      }
      return null;
    };

    $scope.findUserAvatar = function(userID) {
      return $scope.findUser(userID).avatar;
    };

    $scope.findUserNick = function(userID) {
      return $scope.findUser(userID).nick;
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