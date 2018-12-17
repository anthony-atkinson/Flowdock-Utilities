'use strict';

angular.module('myApp.UserList', ['ngRoute', 'ngCookies', 'myApp.FlowdockAuthService', 'myApp.UserUtil']).
controller('UserListCtrl', ['$scope', '$cookies', '$location', '$http', 'FlowdockAuthService', 'UserUtil',
  function($scope, $cookies, $location, $http, authService, userUtil) {

    $scope.ListOfUsers = function() {
      return userUtil.ListOfUsers();
    };

    $scope.findUserAvatar = function(user) {
      return userUtil.findUserAvatar(user.id);
    };

    $scope.linkToFlow = function(user) {
      return "https://www.flowdock.com/app/private/" + user.id;
    };

    $scope.findUserNick = function(user) {
      return userUtil.findUserNick(user.id);
    };

  }
]);
