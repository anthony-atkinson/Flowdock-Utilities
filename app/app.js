'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'ngAudio',
  'ngCookies',
  'myApp.DateUtil',
  'myApp.FlowdockAuthService',
  'myApp.NotificationService',
  'myApp.FlowdockNotifierService',
  'myApp.Notifier',
  'myApp.UserList',
  'myApp.FlowList',
  'myApp.Tags',
  'myApp.Search',
  'myApp.version'
]).
config(['$locationProvider', '$routeProvider',
  function($locationProvider, $routeProvider) {
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
        .when('/Tags', {
          templateUrl: 'Tags/Tags.html'
        })
        .otherwise({redirectTo: '/Notifier'});
  }
]).
controller('MainAppCtrl', ['$scope', '$cookies', '$location', '$http', '$filter', 'ngAudio',
  'FlowdockAuthService', 'NotificationService',
  function($scope, $cookies, $location, $http, $filter, ngAudio, authServ, notificationServ) {
    $scope.AppMode = $location.path().replace('/', '');

    $scope.setAppMode = function(mode) {
      $scope.AppMode = mode;
      $location.path(mode);
    };
  }
]);
