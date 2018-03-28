/**
 * Created by Anthony on 1/11/2017.
 */
'use strict';

angular.module('myApp.FlowdockNotifierService', ['ngCookies', 'myApp.FlowdockAuthService', 'myApp.NotificationService']).
service('FlowdockNotifierService', ['$filter', '$cookies', 'FlowdockAuthService', 'NotificationService',
  function($filter, $cookies, authService, notificationService) {
    var constantlyWatchedStreams = [];
    var keywordWatchedStreams = [];
    
    var serviceRoot = this;
    
    this.ListeningToConstantlyFlows = false;
    this.ListeningToKeywordFlows = false;
    this.SoundEnabledForKeywords = ($cookies.get('SoundEnabledForKeywords') !== null && $cookies.get('SoundEnabledForKeywords') !== undefined) ?
      $cookies.get('SoundEnabledForKeywords') == 'true' : true;
    this.SoundEnabledForConstant = ($cookies.get('SoundEnabledForConstant') !== null && $cookies.get('SoundEnabledForConstant') !== undefined) ?
      $cookies.get('SoundEnabledForConstant') == 'true' : true;
    this.ParsedWordsToWatchFor = [];
  
    this.startListening = function(flowSet, flowList) {
      if(flowSet === undefined || flowSet == null) {
        throw "flowSet not specified. Unable to continue";
      }
  
      for(var i = 0, len = flowList.length; i < len; i++) {
        var flowName = flowList[i];
        var foundFlowObj = $filter('filter')(authService.ListOfFlows, {parameterized_name: flowName}, true);
        if(foundFlowObj.length) {
          if(flowSet == 'constantlyWatched') {
            this.ListeningToConstantlyFlows = true;
          }else if(flowSet == 'keywordsWatched') {
            this.ListeningToKeywordFlows = true;
          }
  
          var flowOrgParamName = foundFlowObj[0].organization.parameterized_name;
          var localStream = new EventSource('https://stream.flowdock.com/flows/' + flowOrgParamName +
            '/' + flowName + '?access_token=' + authService.access_token);
          localStream.AttachedFlow = foundFlowObj[0];
          localStream.FlowSet = flowSet;
  
          localStream.onopen = function(event) {
            console.log('Starting listening to flow ' + this.AttachedFlow.name + ' (' +
              this.AttachedFlow.organization.name + ')!');
          };
          localStream.onmessage = function(event) {
            var message = JSON.parse(event.data);
            if(message.event === 'message') {
              if(event.target.FlowSet === 'keywordsWatched') {
                var msg = message.content.toLowerCase();
                for(var j in serviceRoot.ParsedWordsToWatchFor) {
                  var searchWord = serviceRoot.ParsedWordsToWatchFor[j];
                  var lowerCasedWord = searchWord.toLowerCase();
                  if(msg.indexOf(lowerCasedWord) > -1) {
                    var flowName = event.target.AttachedFlow.name;
                    var body = 'Someone mentioned "' + lowerCasedWord + '" in the "' + flowName + '" flow.';
                    notificationService.spawnNotification(body, null, null, serviceRoot.SoundEnabledForKeywords);
                    break;
                  }
                }
              }else if(event.target.FlowSet === 'constantlyWatched') {
                var fullMsg = '';
                var foundUsr = $filter('filter')(authService.ListOfUsers, {id: parseInt(message.user) }, true);
                if(foundUsr.length) {
                  fullMsg = foundUsr[0].nick + ': ';
                }
                fullMsg += message.content;
                notificationService.spawnNotification(fullMsg, null, event.target.AttachedFlow.name,
                  serviceRoot.SoundEnabledForConstant);
              }
            }
          };
          if(flowSet === 'keywordsWatched') {
            keywordWatchedStreams.push(localStream);
          }else if(flowSet === 'constantlyWatched') {
            constantlyWatchedStreams.push(localStream);
          }
        }else {
          console.log('Unable to find stream with name ' + flowName + '. Do you still belong to it?');
        }
      }
  
    };
  
    this.stopListening = function(flowSet) {
      if(flowSet === 'constantlyWatched') {
        this.ListeningToConstantlyFlows = false;
      }else if(flowSet === 'keywordsWatched') {
        this.ListeningToKeywordFlows = false;
      }else {
        throw "flowSet not specified. Unable to continue";
      }
  
      var streamsSize = 0;
      if(flowSet === 'constantlyWatched') {
        streamsSize = constantlyWatchedStreams.length;
      }else if(flowSet === 'keywordsWatched') {
        streamsSize = keywordWatchedStreams.length;
      }
  
      for(var i = 0; i < streamsSize; i++) {
        if(flowSet === 'constantlyWatched') {
          constantlyWatchedStreams[i].close();
          constantlyWatchedStreams[i] = null;
        }else if(flowSet === 'keywordsWatched') {
          keywordWatchedStreams[i].close();
          keywordWatchedStreams[i] = null;
        }
      }
      if(flowSet === 'constantlyWatched') {
        constantlyWatchedStreams = [];
      }else if(flowSet === 'keywordsWatched') {
        keywordWatchedStreams = [];
      }
    };
  }
]);