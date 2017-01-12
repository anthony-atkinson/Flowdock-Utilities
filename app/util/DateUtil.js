/**
 * Created by Anthony on 1/11/2017.
 */
'use strict';

angular.module('myApp.DateUtil', []).
factory('DateUtil', [function() {
  return {
    oneMonthFromToday: function() {
      return new Date(new Date().getTime() + 24 * 30 * 60 * 60 * 1000);
    }
  }
}]);