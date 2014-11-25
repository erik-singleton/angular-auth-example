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
.config(function($httpProvider, $stateProvider, $urlRouterProvider, $resourceProvider, loginServiceProvider, benConfig) {
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
				menuItems: function(menuItems) {
					return menuItems.get().$promise;
				}
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
				choiceItems: function($resource, $stateParams, menuItems) {
					var menuItem = findBySlug(menuItems.menu, $stateParams.page);
					return $resource(menuItem.url).get().$promise;
				}
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
					controllerProvider: function($stateParams) {
						var ctrlName = capitalize($stateParams.page) + 'Ctrl';
						return ctrlName;
					}
				}
			}
		})
});

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
