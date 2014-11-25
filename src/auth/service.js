/**
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
	$httpProvider.interceptors.push(function($rootScope, $q, authBuffer) {
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
	});
}
	

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
