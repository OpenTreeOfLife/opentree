/*
 knockout-paged.js - A Pager Plugin for Knockout.JS
 Written By: Leland M. Richardson



 Desired API:

 .paged(Number pageSize);
 assumes static data, creates pager with given pageSize

 .paged(Number pageSize, String url);
 assumes `url` is an AJAX endpoint which returns the requested data with
 url parameters "pg" and "perPage"

 .paged(Object config);
 pass config object with optional + required parameters (most flexible)

 //todo: perhaps some "inf-scroll" type functionality?
 //todo: restful configuration?

 Object Configuration:
 .paged({
 pageSize: Number (10),
 cached: Boolean (true),


 url: String


 });


 */



; (function (ko, $) {

    // module scope


    // UTILITY METHODS
    // ------------------------------------------------------------------
    var extend = ko.utils.extend;

    // escape regex stuff
    var regexEscape = function (str) {
        return (str + '').replace(/[\-#$\^*()+\[\]{}|\\,.?\s]/g, '\\$&');
    };

    // simple string replacement
    var tmpl = function (str, obj) {
        for (var i in obj) {
            if (obj.hasOwnProperty(i) !== true) continue;

            // convert to string
            var value = obj[i] + '';

            str = str.replace(new RegExp('{' + regexEscape(i) + '}', 'g'), value);
        }
        return str;
    };

    // construct url with proper data
    var construct_url = function (template, pg, pageSize) {
        var start = pageSize * (pg - 1),
            end = start + pageSize,
            data = { pg: pg, pageSize: pageSize, start: start, end: end };
        return typeof template === 'function' ? template(data) : tmpl(template, data);
    };

    //constructor mapping function...
    var cmap = function (array, Ctor) {
        return $.map(array, function (el) {
            return new Ctor(el);
        });
    };

    // constructs the config object for each isntance based on parameters
    var config_init = function (defaults, a, b, c) {

        var cfg = extend({}, defaults);

        if (typeof a === "number") {
            // pageSize passed as first param
            cfg.pageSize = a;

            if (typeof b === "string") {
                cfg.url = b;
                cfg.async = true;
            }
        } else {
            if (a.url) {
                a.async = true;
            }
            extend(cfg, a);
        }

        // don't let user override success function... use mapFromServer instead
        if (cfg.ajaxOptions && cfg.ajaxOptions.success) {
            console.log("'success' is not a valid ajaxOptions property.  Please look into using 'mapFromServer' instead.");
            delete cfg.ajaxOptions.success;
        }

        return cfg;
    };



    // PLUGIN DEFAULTS
    // ----------------------------------------------------------------------
    var _defaults = {
        pageSize: 10,
        async: false, //TODO: make best guess based on other params passed?


        // async only options
        // --------------------------------------------
        getPage: null,
        url: null, // this can be a string or a function ({pg: pg, pageSize: pageSize, start: start, end: end})

        ctor: null, //constructor to be used for

        // function to be applied on "success" callback to map
        // response to array. Signature: (Object response) -> (Array)
        mapFromServer: null,
        ajaxOptions: {}, //options to pass into jQuery on each request
        cache: true



    };


    // PLUGIN CONSTRUCTOR
    // -----------------------------------------------------------------------
    var asPaged = function (a, b) {
        var items = this,
            hasInitialData = this().length > 0; // target observableArray

        // config initialization
        var cfg = config_init(_defaults, a, b),

        // current page
            current = ko.observable(1),

            pagedItems = ko.computed(function () {
                var pg = current(),
                    start = cfg.pageSize * (pg - 1),
                    end = start + cfg.pageSize;
                return items().slice(start, end);
            });

        // array of loaded
        var loaded = [true]; // set [0] to true just because.
        if (hasInitialData) {
            loaded[current()] = true;
        }
        var isLoading = ko.observable(true);


        // next / previous / goToPage methods

        var goToPage = cfg.async ? function (pg) {
            isLoading(true);
            if (cfg.cache && loaded[pg]) {
                //data is already loaded. change page in setTimeout to make async
                setTimeout(function () {
                    current(pg);
                    isLoading(false);
                }, 0);
            } else {
                // user has specified URL. make ajax request
                $.ajax(extend({
                    url: construct_url(cfg.url, pg, cfg.pageSize),
                    success: function (res) {
                        // allow user to apply custom mapping from server result to data to insert into array
                        var results;
                        if (cfg.mapFromServer) {
                            results = cfg.mapFromServer(res);
                        } else {
                            //todo: check to see if res.data or res.items or something...
                            results = res;
                        }
                        onPageReceived(pg, results);
                        isLoading(false);
                        if (cfg.onsuccess) {
                            cfg.onsuccess(res);
                        }
                    },
                    complete: function () {
                        //todo: user could override... make sure they don't?  (use compose)
                        isLoading(false);
                    }
                }, cfg.ajaxOptions));

            }
        } : current; // if not async, all we need to do is assign pg to current

        //maps new data to underlying array
        var onPageReceived = function (pg, data) {
            // if constructor passed in, map data to constructor
            if (cfg.ctor !== null) {
                data = cmap(data, cfg.ctor);
            }
            // append data to items array
            var start = cfg.pageSize * (pg - 1);
            data.unshift(start, 0);

            Array.prototype.splice.apply(items(), data);
            items.notifySubscribers();
            if (cfg.cache) { loaded[pg] = true; }

            current(pg);
        };

        var next = function () {
            if (next.enabled())
                goToPage(current() + 1);
        };

        next.enabled = ko.computed(function () {
            if (cfg.async) {
                return !(pagedItems().length < cfg.pageSize);
            } else {
                return items().length > cfg.pageSize * current();
            }
        });

        var prev = function () {
            if (prev.enabled())
                goToPage(current() - 1);
        };

        prev.enabled = ko.computed(function () {
            return current() > 1;
        });


        var clearCache = function() {
            loaded = [true];
            items([]);
            goToPage(current());
        };
        var reset = function () {
            current(1);
            clearCache();
        };


        // actually go to first page
        goToPage(current());

        // exported properties
        extend(items, {
            current: current,
            pagedItems: pagedItems,
            pageSize: cfg.pageSize,
            isLoading: isLoading, // might not need this if not async?
            next: next,
            prev: prev,
            goToPage: goToPage,
            clearCache: clearCache,
            reset: reset,

            __paged_cfg: extend({}, cfg) //might want to remove later

        });

        // return target
        return items;
    };
    // expose default options to be changed for users
    asPaged.defaultOptions = _defaults;

    //export to knockout
    ko.observableArray.fn.asPaged = asPaged;

}(ko, $));