'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'ngCookies',
  'myApp.DateUtil',
  'myApp.FlowdockAuthService',
  'myApp.NotificationService',
  'myApp.FlowdockNotifierService',
  'myApp.UserUtil',
  'myApp.Notifier',
  'myApp.UserList',
  'myApp.FlowList',
  'myApp.Tags',
  'myApp.Search'
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
controller('MainAppCtrl', ['$scope', '$cookies', '$location', '$http', '$filter',
  'FlowdockAuthService', 'NotificationService',
  function($scope, $cookies, $location, $http, $filter, authServ, notificationServ) {
    $scope.AppMode = ( $location.path() !== '') ?
        $location.path().replace('/', '') :
        'Notifier';

    $scope.setAppMode = function(mode) {
      $scope.AppMode = mode;
      $location.path(mode);
    };
  }
]);
