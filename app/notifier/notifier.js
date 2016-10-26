'use strict';

angular.module('myApp.notifier', ['ngRoute', 'ngAudio', 'ngCookies'])

    .config(['$routeProvider', function($routeProvider) {
      $routeProvider.when('/notifier', {
        templateUrl: 'notifier/notifier.html'
      });
    }])

    .controller('NotifierCtrl', ['$scope', '$cookies', '$location', '$http', '$filter', 'ngAudio',
      function($scope, $cookies, $location, $http, $filter, ngAudio) {
        var client_id = '';
        var client_secret = '';
        var client_redirect_uri_encoded = '';
        var redirect_url = '';

        var streams = [];
        // Get setting from app_settings.json
        ($http.get(location.protocol + '//' + location.hostname + location.port + '/notifier/app_settings.json')
            .then(function successCallback(response) {
              client_id = response.data.client_id;
              client_secret = response.data.client_secret;
              redirect_url = response.data.redirect_url;
              client_redirect_uri_encoded = encodeURI(redirect_url);
              console.log("settings obtained!");
              setAppVariablesAfterSettingsLoaded();
            }, function errorCallback(response) {
              // console.error('An error occurred! See below:');
              // console.error(response);
              throw "Unable to get app_settings.json from server!";
            }
            )
        );

        function setAppVariablesAfterSettingsLoaded() {
          $scope.ListeningToFlows = false;
          $scope.SoundEnabled = ($cookies.get('SoundEnabled') !== null && $cookies.get('SoundEnabled') !== undefined) ?
              $cookies.get('SoundEnabled') == 'true' : true;
          $scope.NotificationSound = ngAudio.load("assets/sounds/SAO.mp3");

          $scope.access_token = ($cookies.get('access_token') !== null && $cookies.get('access_token') !== undefined) ?
              $cookies.get('access_token') : undefined;

          $scope.userToken = ($cookies.get('userToken') !== null && $cookies.get('userToken') !== undefined) ?
              $cookies.get('userToken') : undefined;
          $scope.access_token = ($cookies.get('access_token') !== null && $cookies.get('access_token') !== undefined) ?
              $cookies.get('access_token') : undefined;
          $scope.refresh_token = ($cookies.get('refresh_token') !== null && $cookies.get('refresh_token') !== undefined) ?
              $cookies.get('refresh_token') : undefined;
          $scope.created_at = ($cookies.get('created_at') !== null && $cookies.get('created_at') !== undefined) ?
              $cookies.get('created_at') : undefined;
          $scope.expires_in = ($cookies.get('expires_in') !== null && $cookies.get('expires_in') !== undefined) ?
              $cookies.get('expires_in') : undefined;

          $scope.ListOfFlows = [];

          $scope.FlowsToListenTo = ($cookies.get('FlowsToListenTo') !== null && $cookies.get('FlowsToListenTo') !== undefined) ?
              $cookies.get('FlowsToListenTo') : [];
          // Possibly fix FlowsToListenTo
          if( !Array.isArray($scope.FlowsToListenTo) && $scope.FlowsToListenTo != '') {
            $scope.FlowsToListenTo = $scope.FlowsToListenTo.split(",");
          }else {
            $scope.FlowsToListenTo = [];
          }

          $scope.WordsToWatchFor = ($cookies.get('WordsToWatchFor') !== null && $cookies.get('WordsToWatchFor') !== undefined) ?
              $cookies.get('WordsToWatchFor') : '';

          $scope.controllerInit();
        }

        function oneMonthFromToday() {
          return new Date(new Date().getTime() + 24 * 30 * 60 * 60 * 1000);
        }

        $scope.toggleSound = function() {
          $scope.SoundEnabled = !$scope.SoundEnabled;
          var valToPutInCookie = ($scope.SoundEnabled) ? 'true' : 'false';
          $cookies.put('SoundEnabled', valToPutInCookie, { path: '/', expires: oneMonthFromToday() } );
        };

        $scope.toggleFlow = function(flowName) {
          var idx = $scope.FlowsToListenTo.indexOf(flowName);
          // is currently selected
          if(idx > -1) {
            $scope.FlowsToListenTo.splice(idx, 1);
          }
          // Is newly selected
          else {
            $scope.FlowsToListenTo.push(flowName);
          }
          // Save to cookie
          $cookies.put('FlowsToListenTo', $scope.FlowsToListenTo, { path: '/', expires: oneMonthFromToday() } );
        };

        $scope.parseWordsToWatchFor = function() {
          $scope.ParsedWordsToWatchFor = $scope.WordsToWatchFor.split(" ");
          $cookies.put('WordsToWatchFor', $scope.WordsToWatchFor, { path: '/', expires: oneMonthFromToday() } );
        };

        $scope.sendTestNotification = function() {
          spawnNotification('This is a test');
        };

        $scope.clearSiteCookies = function() {
          console.log('User reseting cookies');
          $cookies.remove('userToken');
          $cookies.remove('access_token');
          $cookies.remove('refresh_token');
          $cookies.remove('user_token');
          location.reload();
        };

        $scope.startListening = function() {
          console.log('startListening()');
          $cookies.put('FlowsToListenTo', $scope.FlowsToListenTo, { path: '/', expires: oneMonthFromToday() } );
          $cookies.put('WordsToWatchFor', $scope.WordsToWatchFor, { path: '/', expires: oneMonthFromToday() } );
          $cookies.put('SoundEnabled', $scope.SoundEnabled, { path: '/', expires: oneMonthFromToday() } );

          for(var i = 0, len = $scope.FlowsToListenTo.length; i < len; i++) {
            var flowName = $scope.FlowsToListenTo[i];
            var foundFlowObj = $filter('filter')($scope.ListOfFlows, {parameterized_name: flowName}, true);
            if(foundFlowObj.length) {
              $scope.ListeningToFlows = true;
              var flowOrgParamName = foundFlowObj[0].organization.parameterized_name;
              var localStream = new EventSource('https://stream.flowdock.com/flows/' + flowOrgParamName +
                  '/' + flowName + '?access_token=' + $scope.access_token);
              localStream.AttachedFlow = foundFlowObj[0];

              localStream.onopen = function(event) {
                console.log('in business boys!');
              };
              localStream.onmessage = function(event) {
                var message = JSON.parse(event.data);
                if(message.event == 'message') {
                  var msg = message.content.toLowerCase();
                  for(var j in $scope.ParsedWordsToWatchFor) {
                    var searchWord = $scope.ParsedWordsToWatchFor[j];
                    var lowerCasedWord = searchWord.toLowerCase();
                    if(msg.indexOf(lowerCasedWord) > -1) {
                      var flowName = event.target.AttachedFlow.name;
                      var body = 'Someone mentioned "' + lowerCasedWord + '" in the "' + flowName + '" flow.';
                      spawnNotification(body);
                      break;
                    }
                  }
                }
              };
              streams.push(localStream);
            }else {
              console.log('Unable to find stream with name ' + flowName + '. Do you still belong to it?');
            }
          }

        };

        $scope.stopListening = function() {
          $scope.ListeningToFlows = false;
          for(var i = 0, len = streams.length; i < len; i++) {
            streams[i].close();
            streams[i] = null;
          }
          streams = [];
        };

        function authenticateWithFlowdock() {
          // Redirect to get token from Flowdock
          window.location = 'https://www.flowdock.com/oauth/authorize?client_id=' + client_id +
              '&redirect_uri=' + client_redirect_uri_encoded + '&response_type=code';
        }

        function setUpNotificationSystem() {
          // Let's check if the browser supports notifications
          if (!("Notification" in window)) {
            alert("This browser does not support system notifications");
          }

          // Let's check whether notification permissions have already been granted
          else if (Notification.permission === "granted") {
            // Notifications already granted
          }

          // Otherwise, we need to ask the user for permission
          else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {
              // If the user accepts, let's create a notification
              if (permission === "granted") {
                var options = {
                  body: 'Flowdock Notifier has been granted permission to create notifications',
                  icon: 'assets/images/flowdock_icon.png'
                };
                var n = new Notification("Flowdock Notifier", options);
                setTimeout(n.close.bind(n), 10 * 1000);
              }
            });
          }
        }

        $scope.refreshFlowNames = function() {
          // Get Flow Names
          $http({
            method: 'GET',
            // dataType: 'json',
            headers: { 'Content-Type': 'application/json' },
            url: location.protocol + '//' + location.hostname + location.port +
            '/notifier/getFlowNames.php?access_token=' + $scope.access_token
          }).then(function success(response) {
            $scope.ListOfFlows = [];
            var flows = response.data;
            if(Array.isArray(flows)) {
              console.log('flows:');
              console.log(flows);
              for(var i = 0, len = flows.length; i < len; i++) {
                $scope.ListOfFlows.push({
                  id: flows[i].id,
                  name: flows[i].name,
                  parameterized_name: flows[i].parameterized_name,
                  description: flows[i].description,
                  organization: flows[i].organization
                });
              }
            }else {
              console.log('flows was not an array!');
            }

          }, function error(response){
            console.error('An error has occurred retrieving flow names. See below.');
            console.error(response);
          });
        };

        // Taken from http://stackoverflow.com/a/901144 since the angular $location.search()
        // seems to be having problems with the query appearing before the hash.
        function getParameterByName(name) {
          var url = window.location.href;
          name = name.replace(/[\[\]]/g, "\\$&");
          var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
              results = regex.exec(url);
          if (!results) {
            return null;
          }
          if (!results[2]) {
            return '';
          }
          return decodeURIComponent(results[2].replace(/\+/g, " "));
        }

        $scope.controllerInit = function() {
          $scope.parseWordsToWatchFor();
          var code = getParameterByName('code');
          var access_token = getParameterByName('access_token');
          if(code != null) {
            console.log('in if');
            $scope.userToken = code;
            $cookies.put('userToken', $scope.userToken, { path: '/', expires: oneMonthFromToday() } );
            $location.search('code', null);
          }else if(access_token != null) {
            console.log('in else if 1');
            $scope.access_token = access_token;
            $cookies.put('access_token', $scope.access_token, { path: '/', expires: oneMonthFromToday() } );
            $location.search('code', null);
          }else if($scope.userToken !== undefined) {
            console.log('in else if 2');
            // Do nothing since it is already stored in our cookie
          }else {
            console.log('in else');
            authenticateWithFlowdock();
          }

          // Ask for Flowdock for access_token if local access_token is undefined. Only do so if userToken isn't empty as well.
          if($scope.userToken !== undefined && $scope.userToken !== null && $scope.access_token === undefined) {
            console.log('getting access_token');
            $http({
              method: 'POST',
              crossOrigin: true,
              // dataType: 'json',
              headers: { 'Content-Type': 'application/json' },
              url: location.protocol + '//' + location.hostname + location.port + '/notifier/getAccessToken.php',
              data: {
                client_id: client_id,
                client_secret: client_secret,
                code: $scope.userToken,
                redirect_uri: redirect_url,
                grant_type: 'authorization_code',
                provider: $http,
                ReturnUrl: redirect_url
              }
            }).then(function successCallback(response) {
              // console.log(response.data);

              $scope.access_token = response.data.access_token;
              $cookies.put('access_token', response.data.access_token, { path: '/', expires: oneMonthFromToday() } );

              $scope.refresh_token = response.data.refresh_token;
              $cookies.put('refresh_token', response.data.refresh_token, { path: '/', expires: oneMonthFromToday() } );

              $scope.created_at = new Date(response.data.created_at);
              $cookies.put('created_at', response.data.created_at, { path: '/', expires: oneMonthFromToday() } );

              $scope.expires_in = new Date(response.data.created_at + response.data.expires_in);
              $cookies.put('expires_in', response.data.expires_in, { path: '/', expires: oneMonthFromToday() } );

              $scope.refreshFlowNames();
            }, function errorCallback(response) {
              console.error('An error occurred! See below:');
              console.error(response);
            });
          }
          // Token may need refreshed; Check to see if our current access token has expired
          else if($scope.created_at !== undefined && $scope.created_at !== null && $scope.expires_in !== undefined && $scope.expires_in !== null) {
            console.log('Refreshing Token');
            var curDate = new Date();
            if(curDate > $scope.expires_in) {
              $http({
                method: 'POST',
                crossOrigin: true,
                headers: { 'Content-Type': 'application/json' },
                url: location.protocol + '//' + location.hostname + location.port + '/notifier/getAccessToken.php',
                data: {
                  refresh_token: $scope.refresh_token,
                  client_id: client_id,
                  client_secret: client_secret,
                  grant_type: 'refresh_token',
                  provider: $http,
                  ReturnUrl: client_redirect_uri_encoded
                }
              }).then(function successCallback(response) {
                $scope.access_token = response.data.access_token;
                $cookies.put('access_token', response.data.access_token, { path: '/', expires: oneMonthFromToday() } );

                $scope.refresh_token = response.data.refresh_token;
                $cookies.put('refresh_token', response.data.refresh_token, { path: '/', expires: oneMonthFromToday() } );

                $scope.created_at = new Date(response.data.created_at);
                $cookies.put('created_at', response.data.created_at, { path: '/', expires: oneMonthFromToday() } );

                $scope.expires_in = new Date(response.data.created_at + response.data.expires_in);
                $cookies.put('expires_in', response.data.expires_in, { path: '/', expires: oneMonthFromToday() } );

                $scope.refreshFlowNames();

              }, function errorCallback(response) {
                console.error('An error occurred! See below:');
                console.error(response);
              });
            }else {
              console.log('auto-refreshing flow names.');
              $scope.refreshFlowNames();
            }
          }
          // Clear out query string if needed
          if(window.location.search !== undefined && window.location.search.length > 0) {
            setTimeout(function() {
              window.location.href = window.location.href.split("?")[0];
            }, 1500);
          }

          setUpNotificationSystem();

        };

        function spawnNotification(body, icon, title) {
          if(icon == null || icon == undefined) {
            icon = "assets/images/flowdock_icon.png";
          }
          if(title == null || title == undefined) {
            title = "Flowdock Notifier";
          }
          var options = {
            body: body,
            icon: icon
          };

          // Let's check if the browser supports notifications
          if (!("Notification" in window)) {
            alert("This browser does not support system notifications");
          }

          // Let's check whether notification permissions have already been granted
          else if (Notification.permission === "granted") {
            // If it's okay let's create a notification
            var n = new Notification(title, options);
            if($scope.SoundEnabled) {
              $scope.NotificationSound.play();
            }
            setTimeout(n.close.bind(n), 10 * 1000);
          }

          // Otherwise, we need to ask the user for permission
          else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {
              // If the user accepts, let's create a notification
              if (permission === "granted") {
                var n = new Notification(title, options);
                if($scope.SoundEnabled) {
                  $scope.NotificationSound.play();
                }
                setTimeout(n.close.bind(n), 10 * 1000);
              }
            });
          }
        }

      }
    ]).
run(function ($http) {
  // Sends this header with any AJAX request
  $http.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
  // Send this header only in post requests. Specifies you are sending a JSON object
  $http.defaults.headers.post['dataType'] = 'json'
});