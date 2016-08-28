'use strict';

angular.module('myApp.notifier', ['ngRoute', 'ngAudio', 'ngCookies'])

    .config(['$routeProvider', function($routeProvider) {
      $routeProvider.when('/notifier', {
        templateUrl: 'notifier/notifier.html'
      });
    }])

    .controller('NotifierCtrl', ['$scope', '$cookies', '$location', '$http', '$filter', 'ngAudio',
      function($scope, $cookies, $location, $http, $filter, ngAudio) {
        var client_id = 'bfc652cbb77ce16d2f78b6674e022957f1a01ef9678f0b5a1314257e77dc3fd6';
        var client_secret = '8f153ae7f6ab115847445c7fe8ff78f75784b8d68e924e86940dc405dfcde88b';
        var client_redirect_uri_encoded = 'http%3A%2F%2F10.230.1.207%2FFlowdock-Notifier%2Fnotifier';
        var redirect_url = 'http://10.230.1.207/Flowdock-Notifier/notifier';

        var streams = [];

        $scope.ListeningToFlows = false;
        $scope.SoundEnabled = ($cookies.get('SoundEnabled') !== null && $cookies.get('SoundEnabled') !== undefined) ?
            $cookies.get('SoundEnabled') : true;
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

        function oneMonthFromToday() {
          return new Date(new Date().getTime() + 24 * 30 * 60 * 60 * 1000);
        }

        $scope.toggleSound = function() {
          $scope.SoundEnabled = !$scope.SoundEnabled;
          $cookies.put('SoundEnabled', $scope.SoundEnabled, { path: '/', expires: oneMonthFromToday() } );
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
          $cookies.remove('userToken', {path: '/'} );
          $cookies.remove('access_token', {path: '/'} );
          $cookies.remove('refresh_token', {path: '/'} );
          $cookies.remove('user_token', {path: '/'} );
          $cookies.remove('created_at', {path: '/'} );
          $cookies.remove('expires_in', {path: '/'} );
          location.reload();
        };

        $scope.startListening = function() {
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

        $scope.testSignIn = function() {
          authenticateWithFlowdock();
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
            '/Flowdock-Notifier/notifier/getFlowNames.php?access_token=' + $scope.access_token
          }).then(function success(response) {
            $scope.ListOfFlows = [];
            var flows = response.data;
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
          }, function error(response){
            console.error('An error has occurred retrieving flow names. See below.');
            console.error(response);
          });
        };

        $scope.controllerInit = function() {
          $scope.parseWordsToWatchFor();
          var search = $location.search();
          if(search.code !== undefined) {
			console.log('user_token exists in query string.');
            $scope.userToken = search.code;
            $cookies.put('userToken', $scope.userToken, { path: '/', expires: oneMonthFromToday() } );
            $location.search('code', null);
          }else if(search.access_token !== undefined) {
			console.log('saving access_tokken');
            $scope.access_token = search.access_token;
            $cookies.put('access_token', $scope.access_token, { path: '/', expires: oneMonthFromToday() } );
            $location.search('code', null);
          }else if($scope.userToken !== undefined) {
            // Do nothing since it is already stored in our cookie
          }else {
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
              url: location.protocol + '//' + location.hostname + location.port + '/Flowdock-Notifier/notifier/getAccessToken.php',
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
			  if(response.data.access_token !== undefined && response.data.access_token !== null) {
				console.log(response.data);
				
				$scope.access_token = response.data.access_token;
                $cookies.put('access_token', response.data.access_token, { path: '/', expires: oneMonthFromToday() } );

                $scope.refresh_token = response.data.refresh_token;
                $cookies.put('refresh_token', response.data.refresh_token, { path: '/', expires: oneMonthFromToday() } );

                $scope.created_at = new Date(response.data.created_at);
                $cookies.put('created_at', response.data.created_at, { path: '/', expires: oneMonthFromToday() } );

                $scope.expires_in = new Date(response.data.created_at + response.data.expires_in);
                $cookies.put('expires_in', response.data.expires_in, { path: '/', expires: oneMonthFromToday() } );

                $scope.refreshFlowNames();
			  }else {
				console.error('access_token response was not valid!');
			  }
              
            }, function errorCallback(response) {
              console.error('An error occurred! See below:');
              console.error(response);
            });
          }
          // Token may need refreshed; Check to see if our current access token has expired
          else if($scope.created_at !== undefined && $scope.created_at !== null && $scope.expires_in !== undefined && $scope.expires_in !== null) {
            var curDate = new Date();
            if(curDate > $scope.expires_in) {
			  console.log('Refreshing Token');
              $http({
                method: 'POST',
                crossOrigin: true,
                headers: { 'Content-Type': 'application/json' },
                url: location.protocol + '//' + location.hostname + location.port + '/Flowdock-Notifier/notifier/getAccessToken.php',
                data: {
                  refresh_token: $scope.refresh_token,
                  client_id: client_id,
                  client_secret: client_secret,
                  grant_type: 'refresh_token',
                  provider: $http,
                  ReturnUrl: redirect_url
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