'use strict';

angular.module('v2')

  .config(function config($stateProvider) {
    $stateProvider
      .state('new', {
        url: '/new',
        views: {
          'main@': {
            controller: 'NewCtrl',
            templateUrl: 'app/new/new.html'
          }
        }
      })
  })

  .controller('NewCtrl', function (
    $scope,
    $log,
    ngDialog,
    Algorithms,
    Datasource,
    Parameter,
    AlgorithmExecution,
    usSpinnerService,
    $location,
    InputStore,
    AvailableAlgorithmFiles,
    AvailableInputFiles,
    Delete,
    StopExecution) {

    //Exported functions
    $scope.openAlgorithmSettings = openNewAlgorithm;
    $scope.openDatasourceSettings = openNewDatasource;
    $scope.executeAlgorithm = executeAlgorithm;
    $scope.toggleDatasource = toggleDatasource;
    $scope.activateAlgorithm = activateAlgorithm;
    $scope.confirmDelete = confirmDelete;
    $scope.confirmDialog = confirmDialog;
    $scope.editAlgorithm = editAlgorithm;
    $scope.editDatasource = editDatasource;
    $scope.resetAlgorithm = resetAlgorithm;
    $scope.resetDataSources = resetDataSources;

    //Exports for dialogs
    $scope.InputStore = InputStore;
    $scope.AvailableAlgorithmFiles = AvailableAlgorithmFiles;
    $scope.AvailableInputFiles = AvailableInputFiles;
    $scope.StopExecution = StopExecution;
    $scope.doneEditingDatasources = doneEditingDatasources;

    //Exported variables
    $scope.algorithms = [];  // algorithm categories + algorithms
    $scope.datasources = []; // datasource
    $scope.maxNumberOfSetting = {};
    $scope.model = {}; // saved params go here
    $scope.form = [];  // params form
    $scope.schema = {  // schema of params section
      type: 'object',
      properties: {},
      required: []
    };
    $scope.algorithmHasCustomProperties;
    $scope.activeAlgorithm;
    $scope.cachingSelection = 'cache';

    //Private variables
    var activeDataSources = {
      'fileInput': [],
      'tableInput': [],
      'databaseConnection': []
    };
    var dataSources = {
      'fileInput': {},
      'tableInput': {},
      'databaseConnection': {}
    };
    var currentParameter;

    $scope.tabs = [
      {
        title: 'New',
        view: 'new'
      },
      {
        title: 'History',
        view: 'history'
      }
    ];

    // Execute initialization
    initializeAlgorithmList();
    initializeDatasources();
    resetParameter();


    // ** FUNCTION DEFINITIONS **
    // **************************


    // ***
    // Initialization
    // ***

    function initializeAlgorithmList() {
      var algorithmCategoryNames = [
        {
          name: 'inclusion-dependency-algorithms',
          display: 'Inclusion Dependency Algorithms'
        },
        {
          name: 'functional-dependency-algorithms',
          display: 'Functional Dependency Algorithms'
        },
        {
          name: 'unique-column-combination-algorithms',
          display: 'Unique Column Combination Algorithms'
        },
        {
          name: 'conditional-unique-column-combination-algorithms',
          display: 'Conditional Unique Column Combination Algorithms'
        },
        {
          name: 'order-dependency-algorithms',
          display: 'Order Dependency Algorithms'
        },
        {
          name: 'basic-statistics-algorithms',
          display: 'Basic Statistics Algorithms'
        }
      ];

      $scope.algorithms = [];

      // Get all algorithms for each category from the database
      // and sort them alphabetically
      algorithmCategoryNames.forEach(function (category) {
        Algorithms.get({type: category.name}, function (result) {
          $scope.algorithms.push({
            name: category.display,
            algorithms: result.sort(function (a, b) {
              return a.name.localeCompare(b.name)
            })
          });
          $scope.algorithms.sort(function (a, b) {
            return a.name.localeCompare(b.name)
          })
        })
      })
    }

    function initializeDatasources() {
      var inputCategories = [
        {
          name: 'file-inputs',
          display: 'File Input'
        },
        {
          name: 'database-connections',
          display: 'Database Connection'
        },
        {
          name: 'table-inputs',
          display: 'Table Inputs'
        }
      ];

      $scope.datasources = [];

      // Get all data sources for each categroy from the database
      // and sort them alphabetically
      inputCategories.forEach(function (category) {
        Datasource.get({type: category.name}, function (result) {
          //Remove path from element name
          result.forEach(function (element) {
            if (category.name == 'file-inputs') element.name = element.name.replace(/^.*[\\\/]/, '');
            element.disabled = false;
            dataSources[element.type]['' + element.id] = element
          });
          $scope.datasources.push({
            name: category.display,
            datasource: result.sort(function (a, b) {
              return a.name.localeCompare(b.name)
            }),
            possible: true
          });
          $scope.datasources.sort(function (a, b) {
            return a.name.localeCompare(b.name)
          })
        })
      })
    }


    // ***
    // Dialogs
    // ***

    function openNewAlgorithm() {
      ngDialog.open({
        template: '/assets/new-algorithm.html',
        scope: $scope,
        preCloseCallback: function () {
          doneEditingAlgorithm()
        },
        controller: ['$scope', function ($scope) {
          if ($scope.$parent.AlgorithmToEdit) {
            $scope.newAlgorithm = $scope.$parent.AlgorithmToEdit
          } else {
            $scope.newAlgorithm = {}
          }
          $scope.saveNewAlgorithm = saveNewAlgorithm;
          $scope.algorithmFiles = [];
          loadAvailableAlgorithms();
          function loadAvailableAlgorithms() {
            $scope.$parent.AvailableAlgorithmFiles.get(function (result) {
              $scope.$parent.algorithms.forEach(function (algorithmCategory) {
                algorithmCategory.algorithms.forEach(function (algorithm) {
                  var index = result.indexOf(algorithm.fileName);
                  if (index !== -1) {
                    result.splice(index, 1);
                  }
                })
              });
              $scope.algorithmFiles = result
            })
          }

          function saveNewAlgorithm(algorithm) {
            startSpin();
            var obj = {
              "id": algorithm.id,
              "fileName": algorithm.fileName,
              "name": algorithm.name,
              "author": algorithm.author,
              "description": algorithm.description,
              "ind": algorithm.ind,
              "fd": algorithm.fd,
              "ucc": algorithm.ucc,
              "cucc": algorithm.cucc,
              "od": algorithm.od,
              "relationalInput": algorithm.relationalInput,
              "databaseConnection": algorithm.databaseConnection,
              "tableInput": algorithm.tableInput,
              "fileInput": algorithm.fileInput,
              "basicStat": algorithm.basicStat
            };
            if ($scope.$parent.AlgorithmToEdit) {
              $scope.$parent.InputStore.updateAlgorithm(obj, function () {
                stopSpin();
                initializeAlgorithmList();
                ngDialog.closeAll()
              }, function () {
                stopSpin();
                alert("An error occured when loading this algorithm! Maybe constrains are violated?")
              })
            }
            else {
              $scope.$parent.InputStore.newAlgorithm(obj, function () {
                stopSpin();
                initializeAlgorithmList();
                ngDialog.closeAll()
              }, function () {
                stopSpin();
                alert("An error occured when loading this algorithm! Maybe constrains are violated?")
              })
            }
          }
        }]
      })
    }

    function openNewDatasource() {
      ngDialog.open({
        template: '/assets/new-datasource.html',
        scope: $scope,
        preCloseCallback: function () {
          doneEditingDatasources()
        },
        controller: ['$scope', function ($scope) {
          $scope.selectDatasourceCategory = selectDatasourceCategory;
          $scope.saveNewFileInput = saveNewFileInput;
          $scope.saveDatabaseInput = saveDatabaseInput;
          $scope.saveTableInput = saveTableInput;
          $scope.newDataSourceCategory = 'file';
          if ($scope.$parent.editFileInput) {
            $scope.file = $scope.$parent.editFileInput;
            $scope.newDataSourceCategory = 'file'
          } else {
            $scope.file = {
              "separator": ',',
              "quoteChar": '"',
              "escapeChar": '\\',
              "skipLines": '0',
              "strictQuotes": false,
              "ignoreLeadingWhiteSpace": true,
              "hasHeader": true,
              "skipDifferingLines": false,
              "nullValue": ''
            }
          }
          if ($scope.$parent.editDatabaseInput) {
            $scope.database = $scope.$parent.editDatabaseInput;
            $scope.newDataSourceCategory = 'database'
          } else {
            $scope.database = {}
          }
          if ($scope.$parent.editTableInput) {
            $scope.table = $scope.$parent.editTableInput;
            $scope.newDataSourceCategory = 'table'
          } else {
            $scope.table = {}
          }
          $scope.files = [];
          $scope.databaseConnections = [];
          loadAvailableFiles();
          loadAvailableDatasources();
          function selectDatasourceCategory(category) {
            $scope.newDataSourceCategory = category
          }

          function loadAvailableFiles() {
            $scope.AvailableInputFiles.get(function (result) {
              $scope.$parent.datasources.forEach(function (category) {
                if (category.name == 'File Input') {
                  category.datasource.forEach(function (file) {
                    var index = result.indexOf(file.fileName);
                    if (index !== -1) {
                      result.splice(index, 1);
                    }
                  })
                }
              });
              $scope.files = result
            })
          }

          function loadAvailableDatasources() {
            $scope.$parent.datasources.forEach(function (category) {
              if (category.name == 'Database Connection') {
                $scope.databaseConnections = category.datasource
              }
            })
          }

          function saveNewFileInput(file) {
            startSpin();
            var obj = {
              "type": "fileInput",
              "id": file.id || 1,
              "name": file.fileName || '',
              "fileName": file.fileName || '',
              "separator": file.separator || '',
              "quoteChar": file.quoteCharacter || '',
              "escapeChar": file.escapeCharacter || '',
              "skipLines": file.line || '',
              "strictQuotes": file.strictQuotes || false,
              "ignoreLeadingWhiteSpace": file.ignoreLeadingWhiteSpace
              || false,
              "hasHeader": file.hasHeader || false,
              "skipDifferingLines": file.skipDifferingLines || false,
              "comment": file.comment || '',
              "nullValue": file.nullValue || ''
            };
            if ($scope.$parent.editFileInput) {
              $scope.$parent.InputStore.updateFileInput(obj, function () {
                initializeDatasources();
                ngDialog.closeAll();
                stopSpin();
              }, function () {
                alert("An error occured when loading this datasource!");
                stopSpin();
              })
            } else {
              $scope.$parent.InputStore.newFileInput(obj, function () {
                initializeDatasources();
                ngDialog.closeAll();
                stopSpin();
              }, function () {
                alert("An error occured when loading this datasource!");
                stopSpin();
              })
            }
          }

          function saveDatabaseInput(database) {
            startSpin();
            var obj = {
              "type": "databaseConnection",
              "id": database.id || 1,
              "name": database.url + '; ' + database.userName + '; ' + database.system || '',
              "url": database.url || '',
              "username": database.username || '',
              "password": database.password || '',
              "system": database.system || '',
              "comment": database.comment || ''
            };
            if ($scope.$parent.editDatabaseInput) {
              $scope.$parent.InputStore.updateDatabaseConnection(obj,
                function () {
                  initializeDatasources();
                  ngDialog.closeAll();
                  stopSpin();
                },
                function () {
                  alert("An error occured when loading this datasource!");
                  stopSpin();
                })
            } else {
              $scope.$parent.InputStore.newDatabaseConnection(obj,
                function () {
                  initializeDatasources();
                  ngDialog.closeAll();
                  stopSpin();
                },
                function () {
                  alert("An error occured when loading this datasource!");
                  stopSpin();
                })
            }
          }

          function saveTableInput(table) {
            if (table.database === undefined) {
              alert("Your table input has no database!");
              return;
            }
            startSpin();
            var obj = {
              "type": "tableInput",
              "id": table.id || 1,
              "name": table.tableName + "; " + table.database.name || '',
              "tableName": table.tableName || '',
              "databaseConnection": {
                "type": "databaseConnection",
                "id": table.database.id,
                "name": table.database.name,
                "url": table.database.url,
                "username": table.database.username,
                "password": table.database.password,
                "system": table.database.system,
                "comment": table.database.comment
              },
              "comment": table.comment || ''
            };
            if ($scope.$parent.editTableInput) {
              $scope.$parent.InputStore.updateTableInput(obj,
                function () {
                  initializeDatasources();
                  stopSpin();
                  ngDialog.closeAll()
                }, function () {
                  alert("An error occured when loading this datasource!");
                  stopSpin();
                })
            } else {
              $scope.$parent.InputStore.newTableInput(obj, function () {
                initializeDatasources();
                ngDialog.closeAll();
                stopSpin();
              }, function () {
                alert("An error occured when loading this datasource!");
                stopSpin();
              })
            }
          }
        }]
      })
    }

    function confirmDelete(item) {
      $scope.confirmText = "Are you sure you want to delete it?";
      $scope.confirmItem = item;
      $scope.confirmFunction = function () {
        switch ($scope.confirmItem.type) {
          case 'fileInput':
            startSpin();
            Delete.file({id: $scope.confirmItem.id}, function () {
              stopSpin();
              initializeDatasources();
              ngDialog.closeAll()
            });
            break;
          case 'databaseConnection':
            startSpin();
            Delete.database({id: $scope.confirmItem.id}, function () {
              stopSpin();
              initializeDatasources();
              ngDialog.closeAll()
            });
            break;
          case 'tableInput':
            startSpin();
            Delete.table({id: $scope.confirmItem.id}, function () {
              stopSpin();
              initializeDatasources();
              ngDialog.closeAll()
            });
            break;
          default:
            startSpin();
            Delete.algorithm({id: $scope.confirmItem.id}, function () {
              stopSpin();
              resetAlgorithm();
              ngDialog.closeAll()
            });
            break
        }
      };
      openConfirm()
    }

    function openConfirm() {
      ngDialog.openConfirm({
        template: '\
                <h3>Confirm</h3>\
                <p>{{$parent.confirmText}}</p>\
                <div class="ngdialog-buttons">\
                    <button type="button" class="ngdialog-button ngdialog-button-secondary" ng-click="closeThisDialog(0)">No</button>\
                    <button type="button" class="ngdialog-button ngdialog-button-warning" ng-click="$parent.confirmDialog(1)">Yes</button>\
                </div>',
        plain: true,
        scope: $scope
      })
    }

    function confirmDialog() {
      $scope.confirmFunction()
    }

    // ***
    // Actions
    // ***

    function toggleDatasource(datasource) {
      var index = activeDataSources[datasource.type].indexOf(datasource.id);
      datasource.active = datasource.active || false;
      datasource.active = !datasource.active;

      if (index === -1) {
        activeDataSources[datasource.type].push(datasource.id)
      } else {
        activeDataSources[datasource.type].splice(index, 1);
        enableAllInputs()
      }

      var type = '';
      if (datasource.type == 'fileInput') {
        type = 'File Input'
      } else if (datasource.type == 'databaseConnection') {
        type = 'Database Connection'
      } else if (datasource.type == 'tableInput') {
        type = 'Table Inputs'
      }

      if ($scope.maxNumberOfSetting[type] !== -1 &&
        $scope.maxNumberOfSetting[type] <= activeDataSources[datasource.type].length) {
        $scope.datasources.forEach(function (ds) {
          if (ds.name.indexOf(type) > -1) {
            ds.datasource.forEach(function (element) {
              if (element.active === undefined || element.active == false) {
                element.disabled = true
              }
            })
          }
        })
      } else {
        enableAllInputs()
      }
    }

    function activateAlgorithm(algorithm) {
      highlightAlgorithm(algorithm);
      updateAvailableDatasources(algorithm);
      enableAllInputs();
      unselectAllInputs();
      resetParameter();
      initializeForm();
      updateParameter(algorithm);
    }

    function executeAlgorithm(caching, memory) {
      var algorithm = $scope.activeAlgorithm;
      try {
        var params = readParamsIntoBackendFormat(currentParameter)
      } catch (e) {
        alert(e.message);
        return;
      }

      var date = new Date();
      var executionIdentifierDate = date.getFullYear() + '-'
        + twoDigetDate(date.getMonth() + 1) + '-' +
        twoDigetDate(date.getDate()) + 'T'
        + twoDigetDate(date.getHours()) +
        twoDigetDate(date.getMinutes())
        + twoDigetDate(date.getSeconds());
      var payload = {
        'algorithmId': algorithm.id,
        'executionIdentifier': algorithm.fileName + executionIdentifierDate,
        'requirements': params,
        'cacheResults': (caching == 'cache'),
        'writeResults': (caching == 'disk'),
        'countResults': (caching == 'count'),
        'memory': memory || ''
      };
      $scope.payload = payload;
      $scope.canceled = false;
      $scope.cancelFunction = function () {
        $scope.canceled = true
      };
      ngDialog.openConfirm({
        template: '\
                <h3>Execution running</h3>\
                <timer interval="1000">Elapsed time: {{days}} days, {{hours}} hour{{hoursS}}, {{minutes}} minute{{minutesS}}, {{seconds}} second{{secondsS}}.</timer>\
                <div class="ngdialog-buttons">\
                    <button type="button" class="ngdialog-button ngdialog-button-warning" ng-click="cancelExecution()">Cancel Execution</button>\
                </div>',
        plain: true,
        scope: $scope,
        showClose: false,
        closeByEscape: false,
        closeByDocument: false,
        controller: ['$scope', function ($scope) {
          $scope.cancelExecution = function () {
            $scope.$parent.cancelFunction();
            var params = {identifier: $scope.$parent.payload.executionIdentifier};
            $scope.$parent.StopExecution.stop(params, function () {
              ngDialog.closeAll()
            })
          }
        }]
      });
      AlgorithmExecution.run({}, payload, function (result) {
        var typeStr = '&ind=' + result.algorithm.ind + '&fd=' + result.algorithm.fd + '&ucc=' + result.algorithm.ucc +
          '&cucc=' + result.algorithm.cucc + '&od=' + result.algorithm.od + '&basicStat=' + result.algorithm.basicStat;
        ngDialog.closeAll();
        if (!$scope.canceled) {
          if (caching == 'cache' || caching == 'disk') {
            $location.url('/result/' + result.id + '?cached=true' + typeStr);
          } else {
            $location.url('/result/' + result.id + '?count=true' + typeStr);
          }
        }
      }, function (error) {
        ngDialog.closeAll();
        alert("Error!")
      })
    }

    // Activate Algorithm Helpers
    function highlightAlgorithm(algorithm) {
      if ($scope.activeAlgorithm) {
        $scope.activeAlgorithm.active = false
      }
      algorithm.active = true;
      $scope.activeAlgorithm = algorithm
    }

    function updateAvailableDatasources(algorithm) {
      $scope.datasources.forEach(function (datasource) {
        if (datasource.name.indexOf('Table Inputs') > -1) {
          datasource.possible = algorithm.tableInput || algorithm.relationalInput
        } else if (datasource.name.indexOf('Database Connection') > -1) {
          datasource.possible = algorithm.databaseConnection
        } else if (datasource.name.indexOf('File Input') > -1) {
          datasource.possible = algorithm.fileInput || algorithm.relationalInput
        }
      })
    }

    function resetParameter() {
      $scope.model = {};
      $scope.form = [];
      $scope.schema = {
        type: 'object',
        properties: {}
      };
      $scope.algorithmHasCustomProperties = false
    }

    function initializeForm() {
      $scope.form = [
        '*',
        {
          'type': 'actions',
          'items': []
        }
      ]
    }

    function updateParameter(algorithm) {
      currentParameter = [];
      $scope.maxNumberOfSetting = {};
      activeDataSources = {
        'fileInput': [],
        'tableInput': [],
        'databaseConnection': []
      };
      $scope.schema.required = [];

      Parameter.get({algorithm: algorithm.fileName}, function (parameter) {
        // sort parameter, so that the same type of parameter is listed
        // next to each other in the form
        parameter.sort(function(a, b) {
          return a.type.localeCompare(b.type) * -1;
        });
        parameter.forEach(function (param) {
          currentParameter.push(param);
          switch (param.type) {
            case 'ConfigurationRequirementRelationalInput':
              configureParamInputs(param, 'File Input');
              configureParamInputs(param, 'Table Inputs');
              break;
            case 'ConfigurationRequirementFileInput':
              configureParamInputs(param, 'File Input');
              break;
            case 'ConfigurationRequirementTableInput':
              configureParamInputs(param, 'Table Inputs');
              break;
            case 'ConfigurationRequirementDatabaseConnection':
              configureParamInputs(param, 'Database Connection');
              break;
            case 'ConfigurationRequirementInteger':
              addParamToList(param, 'number', false);
              break;
            case 'ConfigurationRequirementListBox':
              addParamToList(param, 'string', true);
              break;
            case 'ConfigurationRequirementString':
              addParamToList(param, 'string', false);
              break;
            case 'ConfigurationRequirementBoolean':
              addParamToList(param, 'boolean', false);
              break;
            default:
              console.error("Parameter type " + param.type + " not supported yet");
              break
          }
        })
      })
    }

    function editDatasource(datasource) {
      switch (datasource.type) {
        case 'fileInput':
          $scope.editFileInput = datasource;
          break;
        case 'databaseConnection':
          $scope.editDatabaseInput = datasource;
          break;
        case 'tableInput':
          $scope.editTableInput = datasource;
          break;
      }
      openNewDatasource()
    }

    function doneEditingDatasources() {
      $scope.editFileInput = null;
      $scope.editDatabaseInput = null;
      $scope.editTableInput = null;
    }

    function doneEditingAlgorithm() {
      $scope.AlgorithmToEdit = null;
    }

    function editAlgorithm(algorithm) {
      $scope.AlgorithmToEdit = algorithm;
      openNewAlgorithm();
    }

    // Parameter Helpers
    function configureParamInputs(param, input) {
      var index = -1;
      $.grep($scope.datasources, function (element, i) {
        if (element !== undefined && element.name !== undefined
          && element.name.indexOf(input) > -1) {
          index = i;
          return true
        } else {
          return false
        }
      });
      if (param.numberOfSettings === -1) {
        $scope.datasources[index].name =
          input + ' (choose an arbitrary number)'
      } else if (param.minNumberOfSettings === param.maxNumberOfSettings) {
        $scope.datasources[index].name =
          input + ' (choose ' + param.minNumberOfSettings + ')'
      } else {
        $scope.datasources[index].name =
          input + ' (min: ' + param.minNumberOfSettings + ' | max: '
          + param.maxNumberOfSettings + ')'
      }
      $scope.maxNumberOfSetting[input] = $scope.maxNumberOfSetting[input] || 0;
      $scope.maxNumberOfSetting[input] += param.maxNumberOfSettings;
    }

    function addParamToList(param, type, dropdown) {
      $scope.algorithmHasCustomProperties = true;
      var identifier;

      if (param.numberOfSettings > 1) {
        for (var i = 1; i <= param.numberOfSettings; i++) {
          identifier = param.identifier + ' (' + i + ')';
          $scope.schema.properties[identifier] = {
            'title': identifier,
            'type': type
          };
          if (dropdown) {
            $scope.schema.properties[identifier].enum = [];
            param.values.forEach( function (v) {
              $scope.schema.properties[identifier].enum.push( v )
            })
          }
          if (param.required) {
            $scope.schema.required.push(identifier)
          }
          if (param.defaultValues !== null && param.defaultValues !== undefined) {
            $scope.schema.properties[identifier].default = param.defaultValues[i]
          }
        }
      } else {
        identifier = param.identifier;
        $scope.schema.properties[identifier] = {
          'title': identifier,
          'type': type
        };
        if (dropdown) {
          $scope.schema.properties[identifier].enum = [];
          param.values.forEach( function (v) {
            $scope.schema.properties[identifier].enum.push( v )
          })
        }
        if (param.required) {
          $scope.schema.required.push(identifier)
        }
        if (param.defaultValues !== null && param.defaultValues !== undefined) {
          $scope.schema.properties[identifier].default = param.defaultValues[0]
        }
      }
    }

    // Other Helpers
    function startSpin() {
      usSpinnerService.spin('spinner-1');
    }

    function stopSpin() {
      usSpinnerService.stop('spinner-1');
    }

    function twoDigetDate(number) {
      return (number < 10 ? '0' + number : '' + number)
    }

    function loadResultsForFileInput() {
      LoadResults
    }

    function resetAlgorithm() {
      initializeAlgorithmList();
      initializeDatasources();
      resetParameter();
      $scope.activeAlgorithm = undefined
    }

    function resetDataSources() {
      enableAllInputs();
      unselectAllInputs();
      resetParameter();
    }

    function unselectAllInputs() {
      [
        'File Input',
        'Database Connection',
        'Table Inputs'
      ].forEach(function (type) {
          $scope.datasources.forEach(function (ds) {
            ds.datasource.forEach(function (element) {
              element.active = false
            })
          })
        })
    }

    function enableAllInputs() {
      [
        'File Input',
        'Database Connection',
        'Table Inputs'
      ].forEach(function (type) {
          $scope.datasources.forEach(function (ds) {
            ds.datasource.forEach(function (element) {
              element.disabled = false
            })
          })
        })
    }

    function readSetting(param, typeValue) {
      var settingValue;
      var j;

      if (param.numberOfSettings > 1) {
        for (j = param.numberOfSettings; j > 0; j--) {
          settingValue = $scope.model[param.identifier + ' (' + j + ')'];
          // only set the value if it is set
          if (settingValue !== undefined) {
            param.settings.push({
              'type': typeValue,
              'value': settingValue
            })
          }
        }
      } else {
        settingValue = $scope.model[param.identifier];
        if (settingValue !== undefined) {
          param.settings.push({
            'type': typeValue,
            'value': settingValue
          })
        }
      }

      return param
    }

    function readParamsIntoBackendFormat(params) {
      var i, j;
      var checked, param, item, paramNumberOfSettings;

      for (i = 0; i < params.length; i++) {
        params[i].settings = [];

        //needed because same fields vary in different places in backend - workaround!
        if (params[i].fixNumberOfSettings !== undefined) {
          delete params[i].fixNumberOfSettings
        }

        paramNumberOfSettings = (params[i].numberOfSettings !== -1) ? params[i].numberOfSettings : 1000;

        switch (params[i].type) {

          case 'ConfigurationRequirementInteger':
            params[i] = readSetting(params[i], 'ConfigurationSettingInteger');
            break;

          case 'ConfigurationRequirementString':
            params[i] = readSetting(params[i], 'ConfigurationSettingString');
            break;

          case 'ConfigurationRequirementBoolean':
            params[i] = readSetting(params[i], 'ConfigurationSettingBoolean');
            break;

          case 'ConfigurationRequirementListBox':
            params[i] = readSetting(params[i], 'ConfigurationSettingListBox');
            break;

          case 'ConfigurationRequirementTableInput':
            checked = activeDataSources.tableInput.slice(0);
            for (j = 1; j <= paramNumberOfSettings && checked.length > 0; j++) {
              item = dataSources.tableInput['' + checked.pop()];
              //needed because same fields are named different in different places in
              // backend - workaround!
              param = {
                "table": item.tableName,
                "databaseConnection": {
                  "dbUrl": item.databaseConnection.url,
                  "username": item.databaseConnection.username,
                  "password": item.databaseConnection.password,
                  "system": item.databaseConnection.system,
                  "type": "ConfigurationSettingDatabaseConnection",
                  "id": item.databaseConnection.id
                },
                "type": "ConfigurationSettingTableInput",
                "id": item.id
              };
              params[i].settings.push(param)
            }
            break;

          case 'ConfigurationRequirementDatabaseConnection':
            checked = activeDataSources.databaseConnection.slice(0);
            for (j = 1; j <= paramNumberOfSettings && checked.length > 0; j++) {
              item = dataSources.databaseConnection['' + checked.pop()];
              //needed because same fields are named different in different places in
              // backend - workaround!
              param = {
                "dbUrl": item.url,
                "username": item.username,
                "password": item.password,
                "system": item.system,
                "type": "ConfigurationSettingDatabaseConnection",
                "id": item.id
              };
              params[i].settings.push(param)
            }
            break;

          case 'ConfigurationRequirementFileInput':
            checked = activeDataSources.fileInput.slice(0);
            for (j = 1; j <= paramNumberOfSettings && checked.length > 0; j++) {
              item = dataSources.fileInput['' + checked.pop()];
              // needed because same fields are named different in different places in
              // backend - workaround!
              param = {
                'fileName': item.fileName,
                'advanced': false,
                'separatorChar': item.separator,
                'quoteChar': item.quoteChar,
                'escapeChar': item.escapeChar,
                'strictQuotes': item.strictQuotes,
                'ignoreLeadingWhiteSpace': item.ignoreLeadingWhiteSpace,
                'skipLines': item.skipLines,
                'header': item.hasHeader,
                'skipDifferingLines': item.skipDifferingLines,
                'nullValue': item.nullValue,
                'type': 'ConfigurationSettingFileInput',
                'id': item.id
              };
              params[i].settings.push(param)
            }
            break;

          case 'ConfigurationRequirementRelationalInput':
            // add table inputs
            checked = activeDataSources.tableInput.slice(0);
            for (j = 1; j <= paramNumberOfSettings && checked.length > 0; j++) {
              item = dataSources.tableInput['' + checked.pop()];
              //needed because same fields are named different in different places in
              // backend - workaround!
              param = {
                "table": item.tableName,
                "databaseConnection": {
                  "dbUrl": item.databaseConnection.url,
                  "username": item.databaseConnection.username,
                  "password": item.databaseConnection.password,
                  "system": item.databaseConnection.system,
                  "type": "ConfigurationSettingDatabaseConnection",
                  "id": item.databaseConnection.id
                },
                "type": "ConfigurationSettingTableInput",
                "id": item.id
              };
              params[i].settings.push(param)
            }
            // add file inputs
            checked = activeDataSources.fileInput.slice(0);
            for (j = 1; j <= paramNumberOfSettings && checked.length > 0; j++) {
              item = dataSources.fileInput['' + checked.pop()];
              //needed because same fields are named different in different places in
              // backend - workaround!
              param = {
                'fileName': item.fileName,
                'advanced': false,
                'separatorChar': item.separator,
                'quoteChar': item.quoteChar,
                'escapeChar': item.escapeChar,
                'strictQuotes': item.strictQuotes,
                'ignoreLeadingWhiteSpace': item.ignoreLeadingWhiteSpace,
                'skipLines': item.skipLines,
                'header': item.hasHeader,
                'skipDifferingLines': item.skipDifferingLines,
                'nullValue': item.nullValue,
                'type': 'ConfigurationSettingFileInput',
                'id': item.id
              };
              params[i].settings.push(param)
            }
            break;

          default:
            console.error('Parameter Type ' + params[i].type
            + ' not not supported yet for execution!');
            break;
        }

        // check if required number of parameters are set
        var numberOfSettings = params[i].settings.length;
        if (params[i].required &&
          params[i].numberOfSettings != -1 &&
          numberOfSettings != params[i].numberOfSettings &&
          (numberOfSettings < params[i].minNumberOfSettings ||
          numberOfSettings > params[i].maxNumberOfSettings)
        ) {
          console.error('Wrong number of settings for parameter type ' + params[i].type
          + '!');
          throw new WrongParameterError('Wrong number of settings for parameter type '
          + params[i].type + '!')
        }
      }

      return params
    }

    function WrongParameterError(message) {
      this.name = "WrongParameterError";
      this.message = (message || "");
    }

    WrongParameterError.prototype = Error.prototype;

  });
