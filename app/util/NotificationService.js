/**
 * Created by Anthony on 1/11/2017.
 */
'use strict';

angular.module('myApp.NotificationService', []).
service('NotificationService', ['$filter', function($filter) {
  var serviceRoot = this;

  this.NotificationHistory = [];
  this.NotificationSound = new Audio("assets/sounds/SAO.mp3");

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


  function NotificationItem(title, body, date) {
    this.Title = title;
    this.Body = body;
    this.FormattedDate = $filter('date')(date, 'yyyy-MM-dd HH:mm:ss');
  }

  this.pushOnToNotificationHistory = function(notif) {
    this.NotificationHistory.push(notif);
    // Pop off the first element if array is larger than 20 elements
    if(this.NotificationHistory.length > 20) {
      this.NotificationHistory.shift();
    }
  };

  this.spawnNotification = function(body, icon, title, playSound, timeout, requireNotificationInteraction) {
    if(icon == null || icon == undefined) {
      icon = "assets/images/flowdock_icon.png";
    }
    if(title == null || title == undefined) {
      title = "Flowdock Notifier";
    }
    if(playSound == null || playSound == undefined) {
      playSound = false;
    }
    if(timeout == null || timeout == undefined) {
      timeout = 10 * 1000;
    }
    if(requireNotificationInteraction == null || requireNotificationInteraction == undefined) {
      requireNotificationInteraction = false;
    }
    var options = {
      body: body,
      icon: icon,
      requireInteraction: requireNotificationInteraction
    };

    this.pushOnToNotificationHistory(new NotificationItem(title, body, new Date()));

    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
      alert("This browser does not support system notifications");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
      // If it's okay let's create a notification
      var n = new Notification(title, options);
      if(playSound) {
        this.NotificationSound.play();
      }
      setTimeout(n.close.bind(n), timeout);
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== 'denied') {
      Notification.requestPermission(function (permission) {
        // If the user accepts, let's create a notification
        if (permission === "granted") {
          var n = new Notification(title, options);
          if(playSound) {
            serviceRoot.NotificationSound.play();
          }
          setTimeout(n.close.bind(n), timeout);
        }
      });
    }
  }
}]);
