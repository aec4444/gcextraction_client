(function() {
  angular
    .module("GameChangerExtraction")
    .directive("ifLoading", ifLoadingDirective)
    .directive("ifNotLoading", ifNotLoadingDirective);

  ifLoadingDirective.$inject = ["$http"];
  function ifLoadingDirective($http) {
    return {
      restrict: "A",
      link: function (scope, elem, attrs) {
        scope.isLoading = isLoading;
        scope.$watch(scope.isLoading, showElement);

        /**
         * Toggle showing or hiding the element that this directive is associated with
         * @param {} loading 
         * @returns {} 
         */
        function showElement(loading) {
          if (loading) elem.show();
          else elem.hide();
        }

        /**
         *  detects whether there is a pending http request
         * @returns {} 
         */
        function isLoading() {
          return $http.pendingRequests.length > 0;
        }
      }
    };
  }

  ifNotLoadingDirective.$inject = ["$http"];
  function ifNotLoadingDirective($http) {
    return {
      restrict: "A",
      link: function (scope, elem, attrs) {
        scope.isLoading = isLoading;
        scope.$watch(scope.isLoading, showElement);

        /**
         * Toggle showing or hiding the element that this directive is associated with
         * @param {} loading 
         * @returns {} 
         */
        function showElement(loading) {
          if (loading) elem.hide();
          else elem.show();
        }

        /**
         *  detects whether there is a pending http request
         * @returns {} 
         */
        function isLoading() {
          return $http.pendingRequests.length > 0;
        }
      }
    };
  }
})();