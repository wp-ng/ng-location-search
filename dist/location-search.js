(function(angular) {
    "use strict";
    angular.module("locationSearch", []).directive("locationSearch", [ "$timeout", "$location", "$window", "$parse", function($timeout, $location, $window, $parse) {
        return {
            restrict: "A",
            require: [ "?ngModel", "?^form" ],
            link: function(scope, elem, attrs, Ctrl) {
                var search_keys = scope.$eval(attrs.locationSearch);
                search_keys = angular.isArray(search_keys) ? search_keys : [ attrs.locationSearch ];
                var modelCtrl = Ctrl[0];
                var formCtrl = Ctrl[1];
                function trailling_slash(url) {
                    return url.replace(/\/$/, "");
                }
                function setLocationSearch(value) {
                    if (!value) {
                        return;
                    }
                    var new_search = {};
                    var reset_search = scope.$eval(attrs.locationSearchReset);
                    var hashUrl = $window.location.hash.replace($location.url(), "");
                    var absUrl = trailling_slash($window.location.href.replace($window.location.hash, ""));
                    try {
                        var value_object = angular.fromJson(value);
                        value = value_object;
                    } catch (err) {}
                    angular.forEach(search_keys, function(key, val) {
                        var search_val = null;
                        if (angular.isObject(value) && angular.isDefined(value[key])) {
                            search_val = value[key];
                        } else if (angular.isString(value)) {
                            search_val = value;
                        }
                        new_search[key] = search_val !== "" ? search_val : null;
                    });
                    var current_search = $location.search();
                    if (!reset_search) {
                        new_search = angular.extend({}, current_search, new_search);
                    }
                    $timeout(function() {
                        $location.search(new_search);
                    });
                    if (attrs.locationSearchUrl && angular.isString(attrs.locationSearchUrl)) {
                        var location_href = trailling_slash(attrs.locationSearchUrl);
                        if (location_href !== absUrl) {
                            var new_href = location_href + "/" + trailling_slash(hashUrl) + $location.url();
                            $timeout(function() {
                                $location.search({}).replace();
                            });
                            $window.location.href = new_href;
                        }
                    }
                }
                if (attrs.locationSearch && (modelCtrl || formCtrl)) {
                    var search = null;
                    var changeModel = function(loc_search) {
                        search = search_keys.length > 1 ? {} : null;
                        angular.forEach(search_keys, function(key, val) {
                            if (angular.isObject(search)) {
                                search[key] = angular.isDefined(loc_search[key]) ? loc_search[key] : null;
                            } else if (angular.isDefined(loc_search[key])) {
                                search = loc_search[key];
                            }
                        });
                        if (angular.isObject(search)) {
                            search = angular.toJson(search);
                        }
                        var getter = $parse(attrs.ngModel);
                        var setter = getter.assign;
                        setter(scope, search);
                    };
                    var changeForm = function(loc_search) {
                        var fields = scope.$eval(attrs.ngSubmit);
                        if (!fields && angular.isObject(fields)) {
                            return;
                        }
                        if (angular.isUndefined(scope[attrs.ngSubmit])) {
                            scope[attrs.ngSubmit] = {};
                        }
                        angular.forEach(search_keys, function(key, val) {
                            if (angular.isDefined(loc_search[key])) {
                                scope[attrs.ngSubmit][key] = loc_search[key];
                            }
                        });
                    };
                    if (modelCtrl) {
                        scope.$watch(function() {
                            return modelCtrl.$modelValue;
                        }, function(newVal, oldVal) {
                            if (newVal !== oldVal) {
                                setLocationSearch(newVal);
                            }
                        });
                        scope.$on("$locationChangeStart", function(event, newUrl, oldUrl, newState, oldState) {
                            changeModel($location.search());
                        });
                        changeModel($location.search());
                    }
                    if (formCtrl) {
                        elem.on("submit", function() {
                            var submit = scope.$eval(attrs.ngSubmit);
                            if (submit) {
                                setLocationSearch(submit);
                            }
                        });
                        scope.$on("$locationChangeStart", function(event, newUrl, oldUrl, newState, oldState) {
                            changeForm($location.search());
                        });
                        changeForm($location.search());
                    }
                }
                scope.$on("$destroy", function handleDestroyEvent() {
                    if (angular.isDefined(scope[attrs.ngSubmit])) {
                        delete scope[attrs.ngSubmit];
                    }
                });
            }
        };
    } ]);
})(window.angular);
//# sourceMappingURL=location-search.js.map
