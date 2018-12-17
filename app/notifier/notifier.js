'use strict';

angular.module('myApp.Notifier', ['ngCookies', 'myApp.FlowdockAuthService', 'myApp.NotificationService',
  'myApp.DateUtil', 'myApp.FlowdockNotifierService']).
controller('NotifierCtrl', ['$scope', '$cookies', '$filter', 'FlowdockAuthService', 'NotificationService',
  'DateUtil', 'FlowdockNotifierService',
  function($scope, $cookies, $filter, authService, notificationService, DateUtil, notifierService) {
    $scope.ListeningToKeywordFlows = function() { return notifierService.ListeningToKeywordFlows; };
    $scope.ListeningToConstantlyFlows = function() { return notifierService.ListeningToConstantlyFlows; };
    $scope.SoundEnabledForKeywords = function() { return notifierService.SoundEnabledForKeywords; };
    $scope.SoundEnabledForConstant = function() { return notifierService.SoundEnabledForConstant; };

    $scope.ListOfFlows = function() { return authService.ListOfFlows; };
    $scope.ListOfUsers = function() { return authService.ListOfUsers; };

    $scope.FlowsToListenToConstantly = ($cookies.get('FlowsToListenToConstantly') !== null && $cookies.get('FlowsToListenToConstantly') !== undefined) ?
      $cookies.get('FlowsToListenToConstantly') : [];
    // Possibly fix FlowsToListenToConstantly
    if( !Array.isArray($scope.FlowsToListenToConstantly) && $scope.FlowsToListenToConstantly != '') {
      $scope.FlowsToListenToConstantly = $scope.FlowsToListenToConstantly.split(",");
    }else {
      $scope.FlowsToListenToConstantly = [];
    }

    $scope.FlowsToListenToKeywords = ($cookies.get('FlowsToListenToKeywords') !== null && $cookies.get('FlowsToListenToKeywords') !== undefined) ?
      $cookies.get('FlowsToListenToKeywords') : [];
    // Possibly fix FlowsToListenToKeywords
    if( !Array.isArray($scope.FlowsToListenToKeywords) && $scope.FlowsToListenToKeywords != '') {
      $scope.FlowsToListenToKeywords = $scope.FlowsToListenToKeywords.split(",");
    }else {
      $scope.FlowsToListenToKeywords = [];
    }

    $scope.WordsToWatchFor = ($cookies.get('WordsToWatchFor') !== null && $cookies.get('WordsToWatchFor') !== undefined) ?
      $cookies.get('WordsToWatchFor') : '';

    $scope.NotificationHistory = function(){ return notificationService.NotificationHistory; };

    $scope.toggleSound = function(flowSet) {
      var valToPutInCookie = 'false';
      var cookieToUpdate = '';
      if(flowSet == 'constantlyWatched') {
        notifierService.SoundEnabledForConstant = !notifierService.SoundEnabledForConstant;
        valToPutInCookie = (notifierService.SoundEnabledForConstant) ? 'true' : 'false';
        cookieToUpdate = 'SoundEnabledForConstant';
      }else if(flowSet == 'keywordsWatched') {
        notifierService.SoundEnabledForKeywords = !notifierService.SoundEnabledForKeywords;
        valToPutInCookie = (notifierService.SoundEnabledForKeywords) ? 'true' : 'false';
        cookieToUpdate = 'SoundEnabledForKeywords';
      }else {
        throw "flowSet not specified. Unable to continue";
      }
      $cookies.put(cookieToUpdate, valToPutInCookie, { path: '/', expires: DateUtil.oneMonthFromToday() } );
    };

    $scope.toggleFlow = function(flowName, flowSet) {
      var flowList = null;
      if(flowSet == 'constantlyWatched') {
        flowList = $scope.FlowsToListenToConstantly;
      }else if(flowSet == 'keywordsWatched') {
        flowList = $scope.FlowsToListenToKeywords;
      }

      if(flowList != null) {
        var idx = flowList.indexOf(flowName);
        // is currently selected
        if(idx > -1) {
          if(flowSet == 'constantlyWatched') {
            $scope.FlowsToListenToConstantly.splice(idx, 1);
          }else if(flowSet == 'keywordsWatched') {
            $scope.FlowsToListenToKeywords.splice(idx, 1);
          }
        }
        // Is newly selected
        else {
          if(flowSet == 'constantlyWatched') {
            $scope.FlowsToListenToConstantly.push(flowName);
          }else if(flowSet == 'keywordsWatched') {
            $scope.FlowsToListenToKeywords.push(flowName);
          }
        }
      }

      // Save to cookie
      $cookies.put('FlowsToListenToConstantly', $scope.FlowsToListenToConstantly, { path: '/', expires: DateUtil.oneMonthFromToday() } );
      $cookies.put('FlowsToListenToKeywords', $scope.FlowsToListenToKeywords, { path: '/', expires: DateUtil.oneMonthFromToday() } );
    };

    $scope.parseWordsToWatchFor = function() {
      notifierService.ParsedWordsToWatchFor = $scope.WordsToWatchFor.split(" ");
      $cookies.put('WordsToWatchFor', $scope.WordsToWatchFor, { path: '/', expires: DateUtil.oneMonthFromToday() } );
    };

    $scope.clearSiteCookies = function() {
      console.log('User reseting cookies');
      $cookies.remove('userToken');
      $cookies.remove('access_token');
      $cookies.remove('refresh_token');
      $cookies.remove('user_token');
      location.reload();
    };

    $scope.startListening = function(flowSet) {
      var flowList = null;
      if(flowSet == 'constantlyWatched') {
        flowList = $scope.FlowsToListenToConstantly;
      }else if(flowSet == 'keywordsWatched') {
        flowList = $scope.FlowsToListenToKeywords;
      }else {
        throw "flowSet not specified. Unable to continue";
      }
      notifierService.startListening(flowSet, flowList);
    };

    $scope.stopListening = function(flowSet) {
      notifierService.stopListening(flowSet);
    };

    $scope.refreshFlowNames = function() {
      authService.refreshFlowNames();
    };

    $scope.refreshUserList = function() {
      authService.refreshUserList();
    };

    $scope.parseWordsToWatchFor();
  }
]);
