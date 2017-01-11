'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'ngAudio',
  'ngCookies',
  'myApp.Notifier',
  'myApp.UserList',
  'myApp.FlowList',
  'myApp.Search',
  'myApp.version'
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider
      .when('/Notifier', {
        templateUrl: 'notifier/notifier.html'
      })
      .when('/UserList', {
        templateUrl: 'UserList/UserList.html'
      })
      .when('/FlowList', {
        templateUrl: 'FlowList/FlowList.html'
      })
      .when('/Search', {
        templateUrl: 'Search/Search.html'
      })
      .otherwise({redirectTo: '/Notifier'});
}]).
controller('MainAppCtrl', ['$scope', '$cookies', '$location', '$http', '$filter', 'ngAudio',
  function($scope, $cookies, $location, $http, $filter, ngAudio) {
    $scope.AppMode = $location.path().replace('/', '');

    $scope.setAppMode = function(mode) {
      $scope.AppMode = mode;
      $location.path(mode);
    }
  }
]);
