'use strict';

angular.module('myApp.FlowList', ['ngRoute', 'ngCookies', 'myApp.FlowdockAuthService']).
controller('FlowListCtrl', ['$scope', '$cookies', '$location', '$http', '$filter', 'FlowdockAuthService',
  function($scope, $cookies, $location, $http, $filter, authService) {

    $scope.ListOfFlows = function() {
      return $filter('orderBy')(authService.ListOfFlows, 'name', false);
    };

    $scope.LinkToFlow = function(flow) {
      if (flow == null || flow == undefined) {
        return '';
      }
      var url = "https://www.flowdock.com/app/:organization/:flow";
      url = url.replace(':organization', flow.organization.parameterized_name);
      url = url.replace(':flow', flow.parameterized_name);
      return url;
    };

  }
]);
