(function(angular) {
    "use strict";
    angular.module("ngLocationSearch", []).directive("ngLocationSearch", [ "$rootScope", "$log", "$timeout", "$location", "$window", "$parse", "$httpParamSerializer", function($rootScope, $log, $timeout, $location, $window, $parse, $httpParamSerializer) {
        return {
            restrict: "A",
            require: [ "?ngModel", "?^form" ],
            link: function(scope, elem, attrs, Ctrl) {
                var default_value = attrs.ngLocationSearchDefault ? scope.$eval(attrs.ngLocationSearchDefault) : null;
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
                    var is_replace_search = scope.$eval(attrs.ngLocationSearchReplace);
                    var reset_search = scope.$eval(attrs.ngLocationSearchReset);
                    var location_href = trailling_slash(attrs.ngLocationSearchUrl);
                    var abs_url = trailling_slash($window.location.href.replace($window.location.hash, ""));
                    var delay_change = attrs.ngLocationSearchDelay || 0;
                    try {
                        var value_object = angular.fromJson(value);
                        value = value_object;
                    } catch (err) {}
                    angular.forEach(search_keys, function(key, val) {
                        var search_val = default_value;
                        if (angular.isObject(value) && angular.isDefined(value[key])) {
                            search_val = value[key];
                        } else if (angular.isString(value)) {
                            search_val = value;
                        }
                        new_search[key] = search_val && search_val !== "" ? search_val.toString() : default_value;
                    });
                    var current_search = $location.search();
                    if (!reset_search) {
                        new_search = angular.extend({}, current_search, new_search);
                    }
                    if (angular.equals(new_search, current_search)) {
                        return;
                    }
                    $rootScope.$broadcast("ngLocationSearchChangeStart", new_search, current_search);
                    $timeout(function() {
                        if (angular.isString(location_href) && location_href !== abs_url) {
                            var is_add_to_url = location_href.indexOf("/") === 0 ? false : true;
                            var is_internal_url = location_href.indexOf("#!/") !== -1 || location_href.indexOf("#/") !== -1;
                            var is_abs_url = location_href.indexOf($location.protocol()) === 0;
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
                                $location.search(new_search);
                            } else {
                                $location.search(param_url);
                                if (is_replace_search) {
                                    scope.$apply();
                                }
                                if (is_add_to_url) {
                                    var _path_urls = path_url.split("/");
                                    if (_path_urls[_path_urls.length - 1] === location_href) {
                                        new_href = path_url;
                                    } else {
                                        new_href = path_url + "/" + location_href;
                                    }
                                } else {
                                    new_href = location_href;
                                }
                                $location.path(new_href);
                                scope.$apply();
                            }
                        } else {
                            $location.search(new_search);
                        }
                        $rootScope.$broadcast("ngLocationSearchChangeSuccess", new_search, current_search);
                    }, parseInt(delay_change, 10));
                }
                if (attrs.ngLocationSearch && (modelCtrl || formCtrl)) {
                    search_keys = scope.$eval(attrs.ngLocationSearch);
                    search_keys = angular.isArray(search_keys) ? search_keys : [ attrs.ngLocationSearch ];
                    var search = default_value;
                    var changeModel = function(loc_search) {
                        search = search_keys.length > 1 ? {} : default_value;
                        angular.forEach(search_keys, function(key, val) {
                            if (angular.isObject(search)) {
                                search[key] = angular.isDefined(loc_search[key]) ? loc_search[key] : default_value;
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
                        if (search_keys.length > 0) {
                            var fields = scope.$eval(attrs.ngSubmit);
                            search = {};
                            angular.forEach(search_keys, function(key, val) {
                                if (angular.isDefined(loc_search[key])) {
                                    search[key] = loc_search[key];
                                }
                            });
                            fields = !angular.isObject(fields) ? {} : fields;
                            search = angular.extend(fields, search);
                            var getter = $parse(attrs.ngSubmit);
                            var setter = getter.assign;
                            setter(scope, search);
                        }
                    };
                    if (modelCtrl) {
                        scope.$watch(function() {
                            return modelCtrl.$modelValue;
                        }, function(newVal, oldVal) {
                            if (newVal !== oldVal && modelCtrl.$valid) {
                                parseLocationSearch(newVal);
                            } else {
                                var model_name = attrs.name;
                                $rootScope.$broadcast("ngLocationSearchChangeError", "model", model_name, modelCtrl);
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
                            var form_name = attrs.name;
                            var form = scope.$eval(form_name);
                            if (submit && (!form || form.$valid)) {
                                parseLocationSearch(submit);
                            } else {
                                $rootScope.$broadcast("ngLocationSearchChangeError", "form", form_name, form);
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
