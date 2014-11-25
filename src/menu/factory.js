/**
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
