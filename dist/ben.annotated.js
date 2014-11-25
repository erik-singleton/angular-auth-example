(function() {
"use strict"
angular.module('ben', [
	'ui.router',
	'ngAnimate',
	'ngResource',
	'ben.auth',
	'ben.core',
	'ben.menu',
	'ben.login',
])

/**
 * @description
 *
 * Initial configuration for this particular app ('ben')
 *
 * Sets defaults from some providers and also defines all of the possible states
 *
 */
.config(['$httpProvider', '$stateProvider', '$urlRouterProvider', '$resourceProvider', 'loginServiceProvider', 'benConfig', function($httpProvider, $stateProvider, $urlRouterProvider, $resourceProvider, loginServiceProvider, benConfig) {
	loginServiceProvider.defaults.loginUrl = benConfig.baseUrl+'login';
	loginServiceProvider.defaults.logoutUrl = benConfig.baseUrl+'logout';
	$httpProvider.defaults.withCredentials = true;
	$resourceProvider.defaults.stripTrailingSlashes = false;
	$urlRouterProvider.otherwise('/');
	$stateProvider
		.state('root', {
			url: '/',
			resolve: {
				// Inject menuItems and have it resolve before loading the state
				menuItems: ['menuItems', function(menuItems) {
					return menuItems.get().$promise;
				}]
			},
			views: {
				'topmenu': {
					templateUrl: 'template/menu/top.html',
					controller: 'TopMenuCtrl',
					controllerAs: 'top'
				},
				'bodycontent': {
					templateUrl: 'template/content/root.html',
					controller: 'RootBodyCtrl',
					controllerAs: 'root'
				}
			}
		})
		.state('root.choice', {
			url: ':page/',
			resolve: {
				// This choiceItems is a general purpose injectable that will return
				// based on the .url property given by menu items
				choiceItems: ['$resource', '$stateParams', 'menuItems', function($resource, $stateParams, menuItems) {
					var menuItem = findBySlug(menuItems.menu, $stateParams.page);
					return $resource(menuItem.url).get().$promise;
				}]
			},
			views: {
				// Because this state inherits from 'root', you have to use the parent 
				// ui-view by adding the @
				'topmenu@': {
					templateUrl: 'template/menu/top.html',
					controller: 'TopMenuCtrl',
					controllerAs: 'top'
				},
				// Because this state inherits from 'root', you have to use the parent 
				// ui-view by adding the @
				'bodycontent@': {
					// Calls a template based on what page is passed as a parameter
					templateUrl: function($stateParams) {
						return 'template/content/'+$stateParams.page+'.html';
					},
					// Calls a controller based on the page url
					// As a result, have to utilize $scope (or hard define controllerAs)
					controllerProvider: ['$stateParams', function($stateParams) {
						var ctrlName = capitalize($stateParams.page) + 'Ctrl';
						return ctrlName;
					}]
				}
			}
		})
}]);

/**
 * @description
 *
 * Helper function to retrieve object by slug
 *
 * @param {object} obj Menu object that is returned by menuItems promise
 * @param {string} slug Slug to use to target object
 *
 */

function findBySlug(obj, slug) {
	for (var i=0, len=obj.length; i<len; i++) {
		if (obj[i].slug === slug) return obj[i];
	}
	return false;
}



function capitalize(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
;angular.module('ben.auth', [
	'ben.auth.service',
	'ben.auth.buffer'
]);

;/**
 * @description
 *
 * Module that registers an interceptor to handle 401 and 403 
 * cases.
 *
 * @dependency ben.authBuffer
 *
 */
angular.module('ben.auth.service', [])

.config(AuthConfig)
.factory('authService', AuthService)

/**
 * @description
 *
 * Registers a factory-style function with $httpProvider's
 * interceptor list. This will run before any response reaches
 * any other part of your app. 
 *
 * This particular example makes use of rootScope; not really
 * sure how else to get an event to propagate throughout.
 *
 * Docs for interceptors are on: https://docs.angularjs.org/api/ng/service/$http
 *
 * @method responseError - This is run when a $http request
 * 		returns an error code (400-500)
 */
function AuthConfig($httpProvider) {
	$httpProvider.interceptors.push(['$rootScope', '$q', 'authBuffer', function($rootScope, $q, authBuffer) {
		return {
			responseError: function(rejection) {
				// If ignoreAuthModule flag is not enabled
				if (!rejection.config.ignoreAuthModule) {
					switch(rejection.status) {
						/**
						 * In case of 401 Unauthorized, the
						 * $http config object is buffered and
						 * deferred. I then check to see if a 
						 * custom Login-Attempted header is set,
						 * if so, broadcast login incorrect, 
						 * otherwise login is required
						 */
						case 401:
							var deferred = $q.defer();
							authBuffer.append(rejection.config, deferred);
							if (rejection.headers('Login-Attempted')) {
								$rootScope.$broadcast('event:auth-loginIncorrect', rejection);
							} else {
								$rootScope.$broadcast('event:auth-loginRequired', rejection);
							}
							return deferred.promise;
						/**
						 * In case of 403 Forbidden, broadcast
						 * auth-forbidden
						 */
						case 403:
							$rootScope.$broadcast('event:auth-forbidden', rejection);
							break;
					}
				}
				/**
				 * Return promised rejection to the rest of
				 * the application
				 */
				return $q.reject(rejection);
			}
		};
	}]);
}
AuthConfig.$inject = ['$httpProvider'];
	

/**
 * @description
 *
 * Factory-style service to supply methods when a successful
 * login is returned, or if a login is cancelled.
 *
 * @method loginConfirmed - this method will broadcast login
 * 		confirmed down the rootScope, and passes the standard
 * 		$http config object to authBuffer.
 *
 * @method loginCancelled - this method will reject all requests
 * 		currently in the authBuffer and broadcast login
 * 		cancelled.
 *
 */
function AuthService($rootScope, authBuffer) {
	return {
		loginConfirmed: function(data, configUpdater) {
			var updater = configUpdater || function(config) { return config; };
			$rootScope.$broadcast('event:auth-loginConfirmed', data);
			authBuffer.retryAll(updater)
		},
		loginCancelled: function(data, reason) {
			authBuffer.rejectAll(reason);
			$rootScope.$broadcast('event:auth-loginCancelled', data);
		}
	};
}
AuthService.$inject = ['$rootScope', 'authBuffer'];


/**
 * @description
 *
 * authBuffer is a private factory that  buffers all requests 
 * made when encountering the 401 error and provides methods 
 * to retry them all on a successful login, or reject them all
 * after a login is cancelled.
 *
 * @function retryHttpRequest - Retries an http request based on
 * 		config and promise
 *
 * 		@param {object} config - $http config object that 
 * 			contains:
 * 				Requested URL
 * 				Payload
 * 				Parameters

 *
 * @method append - Adds to the buffer of requests
 * 		@param {object} config - $http config object
 *		@param {object} deferred - a promise object
 *
 * @method rejectAll - Rejects all requests in buffer and clears
 * 		@param {string} reason - Reason supplied by server
 *
 * @method retryAll - Retries all requests in buffer
 * 		@param {fn} updater - Runs config through this function
 * 			to change config parameters. Useful for updating
 * 			headers with new auth information like tokens.
 *
 */

angular.module('ben.auth.buffer', [])

.factory('authBuffer', AuthBuffer);

function AuthBuffer($injector) {
	var buffer = [];
	// Declare $http variable due to scoping
	var $http;

	function retryHttpRequest(config, deferred) {
		function successCallBack(response) {
			deferred.resolve(response);
		}
		function errorCallBack(response) {
			deferred.reject(response);
		}
		$http = $http || $injector.get('$http');
		$http(config).then(successCallBack, errorCallBack);
	}

	return {
		append: function(config, deferred) {
			buffer.push({
				config: config,
				deferred: deferred
			});
		},
		rejectAll: function(reason) {
			if (reason) {
				for (var i=0, len=buffer.length; i<len; ++i) {
					buffer[i].deffered.reject(reason);
				}
			}
			buffer = [];
		},
		retryAll: function(updater) {
			for (var i=0, len=buffer.length; i<len; ++i) {
				retryHttpRequest(updater(buffer[i].config), buffer[i].deferred);
			}
			buffer = [];
		}
	};
}
AuthBuffer.$inject = ['$injector'];
;angular.module('ben.core', [
	'ben.core.constants',
	'ben.core.controller'
])
;/**
 * @description
 *
 * Provides a few config variables
 *
 */
angular.module('ben.core.constants', [])

.constant('benConfig', {
	'baseUrl': 'http://ben.eriksingleton.com/',
});
;/**
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
PropertiesCtrl.$inject = ['$scope', 'choiceItems'];

function DealsCtrl($scope, choiceItems) {
	$scope.deals = choiceItems.deals;
	$scope.hasPermission = hasPermission;
}
DealsCtrl.$inject = ['$scope', 'choiceItems'];

function ProfileCtrl($scope, choiceItems) {
	$scope.profile = choiceItems.profile;
}
ProfileCtrl.$inject = ['$scope', 'choiceItems'];

function TasksCtrl($scope, choiceItems) {
	$scope.tasks = choiceItems.tasks;
	$scope.hasPermission = hasPermission;
}
TasksCtrl.$inject = ['$scope', 'choiceItems'];


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

;angular.module('ben.login', [
	'ben.auth',
	'ben.login.service',
	'ben.login.controller',
	'ben.login.directive',
]);
;/**
 * @description
 *
 * Controller used by ben.login.directive
 *
 */
angular.module('ben.login.controller', [])

.controller('LoginCtrl', LoginCtrl);



function LoginCtrl($scope, authService, loginService) {
	// this.x exposes these variables to the scope
	this.authService = authService;
	this.loginService = loginService;
	this.url = $scope.url; // Pull URL from dom attribute
	this.show = false;
}
LoginCtrl.$inject = ['$scope', 'authService', 'loginService'];

/**
 * @description
 *
 * POSTs the login information to {$scope.url}. On success
 * call the authService.loginConfirmed() method, on rejection
 * set error flag to true.
 *
 */
LoginCtrl.prototype.postForm = function() {
	var _this = this;
	var options = {
		data: {
			username: _this.user,
			password: _this.password
		}
	};
	_this.loginService.login(options).then(function(resp) {
		if (resp.status >= 200 && resp.status < 400) {
			_this.authService.loginConfirmed()
		}
	}, function(rejection) {
		if (rejection.status >= 400) {
			_this.error = true;
		}
	});
};

LoginCtrl.prototype.logout = function() {
	var _this = this;
	_this.loginService.logout();
};
;/**
 * @description
 *
 * Directive for a login form that is coupled with auth.js
 * Primarily due to it listening for those specific events on
 * the scope.
 *
 * @parameter {string} url - URL to POST login credentials to
 *
 */
angular.module('ben.login.directive', [])

.directive('loginForm', loginForm);


function loginForm($rootScope) {
	return {
		restrict: 'E',
		scope: {
			url: '@'
		},
		transclude: false,
		replace: true,
		templateUrl: 'template/login/login.html',
		controller: LoginCtrl,
		controllerAs: 'login',
		link: function(scope, elem, attr, login) {
			scope.$on('event:auth-loginRequired', function() {
				login.show = true;
			});
			scope.$on('event:auth-loginConfirmed', function() {
				login.show = false;
			});
			/**
			 * This is here to show error messages if a login
			 * is done incorrectly. Not sure if there's a more
			 * semantic way to go about it than setting
			 * custom headers
			 */
			scope.$on('event:auth-loginIncorrect', function() {
				login.error = true;
			});
		}
	};
}
loginForm.$inject = ['$rootScope'];
;angular.module('ben.login.service', [])

.provider('loginService', loginServiceProvider);



function loginServiceProvider() {
	var defaults = {
		loginUrl: 'api/login',
		logoutUrl: 'api/logout'
	};
	return {
		defaults: defaults,
		$get: ['$http', function($http) {
			return {
				login: function(options) {
					var options = options || {};
					var url = options.url || defaults.loginUrl;
					var data = options.data || {};
					return $http.post(url, data);
				},
				logout: function(options) {
					var options = options || {};
					var url = options.url || defaults.logoutUrl;
					return $http.post(url);
				}
			};
		}]
	};
}
;angular.module('ben.menu', [
	'ben.menu.controller',
	'ben.menu.factory'
]);
;angular.module('ben.menu.controller', [])

.controller('TopMenuCtrl', TopMenuCtrl);

function TopMenuCtrl($state, menuItems, loginService) {
	this.$state = $state;
	this.menu = menuItems.menu;
	this.loginService = loginService;
}
TopMenuCtrl.$inject = ['$state', 'menuItems', 'loginService'];	

/**
 * @description
 *
 * Uses the loginService to logout and $state to reload page
 *
 */
TopMenuCtrl.prototype.logout = function() {
	var _this = this;
	_this.loginService.logout().then(function(resp) {
		_this.$state.reload();
	});
};
;/**
 * @description
 *
 * Returns $resource for menu at the top
 *
 */
angular.module('ben.menu.factory', [
	'ngResource',
	'ben.core.constants'
])

.factory('menuItems', menuItems);


function menuItems($resource, benConfig) {
	var baseUrl = benConfig.baseUrl;
	return $resource(baseUrl + 'menu')
}
menuItems.$inject = ['$resource', 'benConfig'];
})()