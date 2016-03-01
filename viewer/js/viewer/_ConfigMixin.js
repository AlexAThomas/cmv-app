define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/Deferred',
    'viewer/_ConfigMixinHelper'
], function (
    declare,
    lang,
    Deferred,
    _ConfigMixinHelper
) {
    'use strict';

    return declare(null, {

        initConfigAsync: function () {
            var returnDeferred = new Deferred();
            // get the config file from the url if present
            var file = 'config/viewer',
                s = window.location.search,
                q = s.match(/config=([^&]*)/i);
            if (q && q.length > 0) {
                file = q[1];
                if (file.indexOf('/') < 0) {
                    file = 'config/' + file;
                }
            }
            require([file], function (config) {				
                var paramItems = ['viewer', 'primos', 'primo_ids', 'primoids', 'eogsymbolize', 'primoSymbols', 'primosymbols', 'primo_symbols'],
                    urlConfig = _ConfigMixinHelper._createUrlParamsObject(paramItems);
                _ConfigMixinHelper._mixinDeep(config, urlConfig);
                returnDeferred.resolve(config);
            });
            return returnDeferred;
        },
        initConfigSuccess: function (config) {
            this.config = config;

            if (config.isDebug) {
                window.app = this; //dev only
            }

            // setup the map click mode
            this.mapClickMode = {
                current: config.defaultMapClickMode,
                defaultMode: config.defaultMapClickMode
            };

            // in _LayoutMixin
            this.initLayout();

            // in _MapMixin
            this.initMapAsync().then(
                lang.hitch(this, 'initMapComplete'),
                lang.hitch(this, 'initMapError')
            );
        },

        initConfigError: function (err) {
            this.handleError({
                source: 'Controller',
                error: err
            });
        }
    });
});