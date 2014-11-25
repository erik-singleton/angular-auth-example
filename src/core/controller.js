/**
 * @description
 *
 * Controllers used by ben.core
 *
 * Typically these should be used for each page view that isn't a module
 *
 */
angular.module('ben.core.controller', [])

.controller('RootBodyCtrl', RootBodyCtrl)
.controller('PropertiesCtrl', PropertiesCtrl)
.controller('DealsCtrl', DealsCtrl)
.controller('ProfileCtrl', ProfileCtrl)
.controller('TasksCtrl', TasksCtrl);



function RootBodyCtrl() {
}

function PropertiesCtrl($scope, choiceItems) {
	$scope.properties = choiceItems.properties;
}

function DealsCtrl($scope, choiceItems) {
	$scope.deals = choiceItems.deals;
	$scope.hasPermission = hasPermission;
}

function ProfileCtrl($scope, choiceItems) {
	$scope.profile = choiceItems.profile;
}

function TasksCtrl($scope, choiceItems) {
	$scope.tasks = choiceItems.tasks;
	$scope.hasPermission = hasPermission;
}


/**
 * @description
 *
 * Helper function to check for permissions
 *
 */
function hasPermission(obj, perm) {
	if (typeof obj.permissions === 'object') {
		return obj.permissions[perm];
	}
}

