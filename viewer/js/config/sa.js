/* eslint-disable */
define([
    'viewer/_ConfigMixinHelper',
    'config/viewer'
], function (Helper, Base) {
    
    var _overrideConfig = {
            divisionId: 63,
            // used for debugging your app
            isDebug: false,
            queryForWebmap: false,
            // map options, passed to map constructor. see: https://developers.arcgis.com/javascript/jsapi/map-amd.html#map1
            mapOptions: {
                center: [-98, 29],
                zoom: 8
            },
            operationalLayers: [{
                type: 'dynamic',
                url: Base.ArcGISServerRoot + 'Mobile/SA_MobileWells/MapServer',
                title: 'Drilled Wells',
                options: {
                    id: 'SA_DrilledWells',
                    opacity: 1.0,
                    visible: true,
                    imageParameters: Base.buildImageParameters({
                        layerIds: [1, 2, 3],
                        layerOption: 'show'
                    })
                },
                layerControlLayerInfos: {
                    subLayerInfos: [{id:1, name:"Top" }, { id:2, name:"Bottom" }, { id:3, name:"Path" }],
                    expanded: false,
                    allSublayerToggles: false,
                    noZoom: true
                },
                legendLayerInfos: true
            }, {
                type: 'dynamic',
                url: Base.ArcGISServerRoot+'Mobile/SA_MobileWells/MapServer',
                title: 'Proposed Wells',
                options: {
                    id: 'SA_ProposedWells',
                    opacity: 1.0,
                    visible: true,
                    imageParameters: Base.buildImageParameters({
                        layerIds: [5, 6, 7],
                        layerOption: 'show'
                    })
                },
                layerControlLayerInfos: {
                    subLayerInfos: [{ id:5, name:"Top" }, { id:6, name:"Bottom" }, { id:7, name:"Path" }],
                    expanded: false,
                    allSublayerToggles: false,
                    noZoom: true
                },
                legendLayerInfos: true
            }]
			/*,
            modules: {
                EOGSymbolizeModule: {
                    options:EOGSymbolizeConfig
                }
            }*/
    }, _config = { };
    (function(base) {
        _config = base;
        //Helper.mixInDeep(_config, EOGSymbolize);
        Helper._mixinDeep(_config, _overrideConfig);
    })(Base)
    return _config;
});
