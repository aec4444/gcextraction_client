(function() {
  angular
    .module("GameChangerExtraction")
    //.config(exceptionProviderConfig)
    .config(httpProviderConfig)
    .config(routeProviderConfig);

  //exceptionProviderConfig.$inject = ["$provide"];
  //function exceptionProviderConfig() {
  //  $provide.decorator("$exceptionHandler", exceptionHandlerDecorator);
  //}

  exceptionHandlerDecorator.$inject = ["$delegate"];
  function exceptionHandlerDecorator($delegate) {
    return function (exception, cause) {
      $delegate(exception, cause);
      alert(exception.message);
    };
  };

  httpProviderConfig.$inject = ["$httpProvider"];
  function httpProviderConfig($httpProvider) {
    //initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
      $httpProvider.defaults.headers.get = {};
    }

    delete $httpProvider.defaults.headers.post['Content-type'];

    //disable IE ajax request caching
    //$httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
    //$httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    //$httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
    //$httpProvider.defaults.useXDomain = true;
    //$httpProvider.defaults.withCredentials = false;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    $httpProvider.interceptors.push(function() {
      return {
        'responseError': function(response) {
          return response;
        }
      };
    });
  };

  routeProviderConfig.$inject = ["$stateProvider", "$urlRouterProvider"];
  function routeProviderConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state("known", {
        url: "/team/{team}",
        templateUrl: "templates/stats.template.html",
        controller: "GameChangerScheduleController",
        controllerAs: "vm",
      })
      .state("specs", {
        url: "/gc/{season}/{name}/{teamId}",
        templateUrl: "templates/stats.template.html",
        controller: "GameChangerScheduleController",
        controllerAs: "vm"
      })
      .state("default", {
        url: "/",
        templateUrl: "templates/stats.template.html",
        controller: "GameChangerScheduleController",
        controllerAs: "vm"
      });

    $urlRouterProvider.otherwise("/");
  }
})();