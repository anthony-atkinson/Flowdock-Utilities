'use strict';

angular.module('myApp.UserList', ['ngRoute', 'ngAudio', 'ngCookies']).
controller('UserListCtrl', ['$scope', '$cookies', '$location', '$http', '$filter', 'ngAudio',
  function($scope, $cookies, $location, $http, $filter, ngAudio) {

    $scope.controllerInit = function() {

    };

  }
]);