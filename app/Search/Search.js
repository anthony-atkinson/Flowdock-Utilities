'use strict';

angular.module('myApp.Search', ['ngRoute', 'ngAudio', 'ngCookies']).
controller('SearchCtrl', ['$scope', '$cookies', '$location', '$http', '$filter', 'ngAudio',
  function($scope, $cookies, $location, $http, $filter, ngAudio) {

    $scope.controllerInit = function() {

    };

  }
]);