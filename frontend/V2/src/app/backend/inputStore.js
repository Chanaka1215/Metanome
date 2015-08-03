'use strict';

angular.module('v2')
    .factory('InputStore', ['$resource',
        function ($resource) {
            return $resource('http://127.0.0.1:8888/api/:type/:action', {}, {
                newAlgorithm: {
                    method: 'POST',
                    params: {
                        type: 'algorithms',
                        action: 'store'
                    }
                },
                newFileInput: {
                    method: 'POST',
                    params: {
                        type: 'file-inputs',
                        action: 'store'
                    }
                },
                newTableInput: {
                    method: 'POST',
                    params: {
                        type: 'table-inputs',
                        action: 'store'
                    }
                },
                newDatabaseConnection: {
                    method: 'POST',
                    params: {
                        type: 'database-connections',
                        action: 'store'
                    }
                },
                updateAlgorithm: {
                    method: 'POST',
                    params: {
                        type: 'algorithms',
                        action: 'update'
                    }
                },
                updateFileInput: {
                    method: 'POST',
                    params: {
                        type: 'file-inputs',
                        action: 'update'
                    }
                },
                updateTableInput: {
                    method: 'POST',
                    params: {
                        type: 'table-inputs',
                        action: 'update'
                    }
                },
                updateDatabaseConnection: {
                    method: 'POST',
                    params: {
                        type: 'database-connections',
                        action: 'update'
                    }
                }
            });
        }
    ])

; 
