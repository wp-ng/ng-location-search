(function(angular) {
    "use strict";
    angular.module("ngLocationSearch", []).directive("ngLocationSearch", [ "$log", "$timeout", "$location", "$window", "$parse", "$httpParamSerializer", function($log, $timeout, $location, $window, $parse, $httpParamSerializer) {
        return {
            restrict: "A",
            require: [ "?ngModel", "?^form" ],
            link: function(scope, elem, attrs, Ctrl) {
                var search_keys;
                var modelCtrl = Ctrl[0];
                var formCtrl = Ctrl[1];
                function trailling_slash(url) {
                    if (angular.isString(url)) {
                        return url.replace(/\/$/, "");
                    }
                    return false;
                }
                function parseLocationSearch(value) {
                    var new_search = {};
                    var reset_search = scope.$eval(attrs.ngLocationSearchReset);
                    var location_href = trailling_slash(attrs.ngLocationSearchUrl);
                    var abs_url = trailling_slash($window.location.href.replace($window.location.hash, ""));
                    var is_add_to_url = location_href.indexOf("/") === 0;
                    var is_internal_url = location_href.indexOf("#!/") !== -1 || location_href.indexOf("#/") !== -1;
                    var is_abs_url = location_href.indexOf($location.protocol()) === 0;
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
                    if (angular.isString(location_href) && location_href !== abs_url) {
                        var path_url = $location.path();
                        var hash_url = trailling_slash($window.location.hash.replace($location.url(), ""));
                        var param_url = $httpParamSerializer(new_search);
                        var new_href = "";
                        if (!$location.$$html5 || is_abs_url) {
                            param_url = param_url ? "?" + param_url : "";
                            new_href = location_href + param_url;
                            if (!is_internal_url && is_abs_url) {
                                path_url = path_url && !$location.$$html5 ? "/" : "";
                                new_href = location_href + hash_url + path_url + param_url;
                            }
                            $window.location.href = new_href;
                        } else {
                            $location.search(param_url);
                            scope.$apply();
                            if (is_add_to_url) {
                                new_href = location_href;
                            } else {
                                new_href = path_url + "/" + location_href;
                            }
                            $location.path(new_href);
                            scope.$apply();
                        }
                        $log.debug(new_href);
                    } else {
                        $timeout(function() {
                            $location.search(new_search);
                        });
                    }
                }
                if (attrs.ngLocationSearch && (modelCtrl || formCtrl)) {
                    search_keys = scope.$eval(attrs.ngLocationSearch);
                    search_keys = angular.isArray(search_keys) ? search_keys : [ attrs.ngLocationSearch ];
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
                                parseLocationSearch(newVal);
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
                                parseLocationSearch(submit);
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
//# sourceMappingURL=ng-location-search.js.map
