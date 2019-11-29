(function(angular) {
    "use strict";
    angular.module("ngLocationSearch", []).directive("ngLocationSearch", [ "$rootScope", "$log", "$timeout", "$location", "$window", "$parse", "$httpParamSerializer", function($rootScope, $log, $timeout, $location, $window, $parse, $httpParamSerializer) {
        return {
            restrict: "A",
            require: [ "?ngModel", "?^form" ],
            link: function(scope, elem, attrs, Ctrl) {
                function untrailling_slash(url) {
                    if (angular.isString(url)) {
                        return url.replace(/\/$/, "");
                    }
                    return false;
                }
                function trailling_slash(url) {
                    if (angular.isString(url)) {
                        return untrailling_slash(url) + "/";
                    }
                    return false;
                }
                function to_type(value, type) {
                    switch (type) {
                      case "array":
                        return angular.isArray(value) ? value : angular.isString(value) && value.length > 0 ? value.split(",") : null;

                      case "number":
                        return angular.isNumber(value) ? value : parseFloat(value);

                      case "string":
                        return angular.isString(value) ? value : null;

                      default:
                        return value;
                    }
                }
                function get_default_value(value, key) {
                    return key && angular.isObject(value) ? value[key] : value;
                }
                var default_value = attrs.ngLocationSearchDefault ? scope.$eval(attrs.ngLocationSearchDefault) : null;
                var search_keys;
                var modelCtrl = Ctrl[0];
                var formCtrl = Ctrl[1];
                var parseLocationSearch = function(value) {
                    var new_search = {};
                    var is_replace_search = scope.$eval(attrs.ngLocationSearchReplace);
                    var reset_search = scope.$eval(attrs.ngLocationSearchReset);
                    var location_href = attrs.ngLocationSearchUrl;
                    var abs_url = $window.location.href.replace($window.location.hash, "");
                    var delay_change = attrs.ngLocationSearchDelay || 0;
                    try {
                        var value_object = angular.fromJson(value);
                        value = value_object;
                    } catch (err) {}
                    angular.forEach(search_keys, function(key, val) {
                        var default_val = get_default_value(default_value, key);
                        if (!value) {
                            default_val = null;
                        }
                        var search_val = default_val;
                        if (angular.isObject(value) && angular.isDefined(value[key])) {
                            search_val = value[key];
                        } else if (angular.isString(value)) {
                            search_val = value;
                        }
                        if (angular.isArray(search_val)) {
                            search_val = search_val.toString();
                        }
                        new_search[key] = search_val && search_val !== "" ? search_val.toString() : search_val === "" ? null : default_val;
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
                            var hash_url = untrailling_slash($window.location.hash.replace($location.url(), ""));
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
                };
                if (attrs.ngLocationSearch && (modelCtrl || formCtrl)) {
                    search_keys = scope.$eval(attrs.ngLocationSearch);
                    search_keys = angular.isArray(search_keys) ? search_keys : [ attrs.ngLocationSearch ];
                    var search = default_value;
                    var changeModel = function(loc_search) {
                        var types = attrs.ngLocationSearchTypes ? scope.$eval(attrs.ngLocationSearchTypes) : {};
                        search = search_keys.length > 1 ? {} : default_value;
                        angular.forEach(search_keys, function(key, val) {
                            var default_val = get_default_value(default_value, key);
                            if (angular.isObject(search)) {
                                search[key] = to_type(angular.isDefined(loc_search[key]) ? loc_search[key] : default_val, types[key]);
                            } else {
                                search = to_type(angular.isDefined(loc_search[key]) ? loc_search[key] : default_val, types[key]);
                            }
                        });
                        if (angular.isObject(search)) {
                            search = angular.toJson(search);
                        }
                        var getter = $parse(attrs.ngModel);
                        var setter = getter.assign;
                        setter(scope, search);
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
                        var resetForm, changeForm, submitForm, applySubmit;
                        changeForm = function(loc_search) {
                            if (search_keys.length > 0) {
                                var fields = scope.$eval(attrs.ngSubmit);
                                var types = attrs.ngLocationSearchTypes ? scope.$eval(attrs.ngLocationSearchTypes) : {};
                                search = {
                                    $resetForm: undefined,
                                    $submitForm: submitForm
                                };
                                angular.forEach(search_keys, function(key, val) {
                                    var default_val = get_default_value(default_value, key);
                                    search[key] = to_type(angular.isDefined(loc_search[key]) ? loc_search[key] : default_val, types[key]);
                                    if (angular.isDefined(loc_search[key])) {
                                        search.$resetForm = resetForm;
                                    }
                                });
                                fields = !angular.isObject(fields) ? {} : fields;
                                search = angular.extend(fields, search);
                                var getter = $parse(attrs.ngSubmit);
                                var setter = getter.assign;
                                setter(scope, search);
                            }
                        };
                        applySubmit = function(data) {
                            var submit = scope.$eval(attrs.ngSubmit);
                            var form_name = attrs.name;
                            var form = scope.$eval(form_name);
                            if (angular.isUndefined(data)) {
                                data = submit;
                            }
                            if (angular.isDefined(data) && (!form || form.$valid)) {
                                parseLocationSearch(data);
                            } else {
                                $rootScope.$broadcast("ngLocationSearchChangeError", "form", form_name, form);
                            }
                            return submit;
                        };
                        submitForm = function(timeout, data) {
                            if (timeout) {
                                $timeout(function() {
                                    applySubmit(data);
                                }, parseInt(timeout, 10));
                            } else {
                                applySubmit(data);
                            }
                        };
                        resetForm = function() {
                            applySubmit(null);
                        };
                        elem.on("submit", function() {
                            applySubmit();
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
