'use strict';

angular.module('v2')
  .factory('Executions', ['$resource',
      function ($resource) {
          return $resource('http://127.0.0.1:8888/api/executions', {}, {
              getAll: {
                  method: 'GET',
                  isArray: true
              }
          });
      }
  ])

; 
