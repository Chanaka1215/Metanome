'use strict';

var app = angular.module('v2')

.config(function config( $stateProvider ) {
  $stateProvider
    .state('history', {
      url: '/history',
      views: {
        'main@': {
            controller: 'HistoryCtrl',
            templateUrl: 'app/history/history.html'
         }
      }
    })
})

app.controller('HistoryCtrl', function ($scope, $log, Executions, $filter) {

  // Public variables
  $scope.content = []
  $scope.headers = [
    {
      name:'',
      field:'id'
    },{
      name:'Algorithm Name',
      field:'name'
    },{
      name: 'Date', 
      field: 'date'
    },{
      name:'Execution Time (d HH:mm:ss)',
      field: 'time'
    },{
      name: 'Inputs', 
      field: 'inputs'
    },{
      name:'Result Types', 
      field: 'resultType'
    },{
      name: '',
      field: 'actions'
    }
  ];
  $scope.loadExecutions = loadExecutions

  // Private varias
  var executions

  loadExecutions()

  // ** FUNCTION DEFINITIONS **
  // **************************

  function loadExecutions() {
    Executions.getAll({}, function(result) {
      executions = result
      $scope.content = []
      result.forEach(function(execution) {
        var duration = execution.end - execution.begin
        if(execution.end == 0) {
          duration = 0
        }
        var inputs = []
        var results = []
        execution.inputs.forEach(function(input) {
            input.name = input.name.replace(/^.*[\\\/]/, '')
            inputs.push(input.name)
        })
        execution.results.forEach(function(result) {
            results.push(result.typeName)
        })
        if(execution.aborted) {
          results = ['EXECUTION ABORTED']
        }
        $scope.content.push({
          id: execution.id,
          name: execution.algorithm.name,
          date: $filter('date')(execution.begin, 'yyyy-MM-dd HH:mm:ss'),
          time: Math.floor(duration/(60*60*24))+' '+twoDigets(Math.floor(duration/(60*60)))+':'+twoDigets(Math.floor((duration/60)%60)) + ':' + twoDigets(Math.floor(duration%60)),
          inputs: inputs.join(', '),
          resultType: results.join(', '),
          actions: ''
        })
      })
        var orderBy = $filter('orderBy');
        $scope.content = orderBy($scope.content, $scope.sortable[0], true);
    })
  }
   
    $scope.custom = {name: 'bold', date:'grey', time: 'grey'};
    $scope.sortable = ['id', 'date', 'name', 'time', 'inputs', 'resultType'];
//    $scope.thumbs = 'thumb';
    $scope.count = 10;
    function twoDigets(number) {
      return (number < 10 ? '0'+number : ''+number)
    }
  });

app.directive('mdTable', function () {
    return {
      restrict: 'E',
      scope: { 
        headers: '=', 
        content: '=', 
        sortable: '=', 
        filters: '=',
        customClass: '=customClass',
        thumbs:'=', 
        count: '=' 
      },
      controller: function ($scope,$filter,$window, $timeout, LoadResults, $location, Delete) {
        var orderBy = $filter('orderBy');
        $scope.tablePage = 0;
        $scope.nbOfPages = function () {
          return Math.ceil($scope.content.length / $scope.count);
        },
        $scope.handleSort = function (field) {
          if ($scope.sortable.indexOf(field) > -1) { return true; } else { return false; }
        };
        $scope.order = function(predicate, reverse) {
          $scope.content = orderBy($scope.content, predicate, reverse);
          $scope.predicate = predicate;
        };
        $scope.order($scope.sortable[0],true);
        $scope.getNumber = function (num) {
          return new Array(num);
        };
        $scope.goToPage = function (page) {
          $scope.tablePage = page;
        };
        $scope.showResult = function(result) {
          $location.url('/result/'+result.id);
        };
        $scope.deleteExecution = function(execution) {
          Delete.execution({id: execution.id}, function(result) {
            $scope.$parent.loadExecutions()
          })
        }
      },
      template: angular.element(document.querySelector('#md-table-template')).html()
    }
  });

app.directive('mdColresize', function ($timeout) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
//      scope.$evalAsync(function () {
//        $timeout(function(){ $(element).colResizable({
//          liveDrag: true,
//          fixed: true
          
//        });},100);
//      });
    }
  }
});

app.filter('startFrom',function (){
  return function (input,start) {
    start = +start;
    return input.slice(start);
  }
});
