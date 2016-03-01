define([
    'dojo/_base/array',
    'dojo/_base/lang'
], function (
    array,
    lang
) {
    'use strict';
    var _LayerControlOptionsHelper = {
        _mixinLayerInfos: function (esriLayerInfos, subLayerInfos) {
            // for each of these layers, go through the subLayerInfos and see if defaultVisiblity is set to true or false
            // then set each of the layer.layerInfos defaultVisibility appropriately
            if (subLayerInfos && subLayerInfos.length !== 0) {
                array.forEach(subLayerInfos, function (sli) {
                    if (typeof sli.defaultVisibility === 'undefined') {
                        sli.defaultVisibility = true;
                    }
                });
                array.forEach(esriLayerInfos, function (li) {
                    var sli = array.filter(subLayerInfos, function (s) {
                        return s.id === li.id;
                    }).shift();
                    if (sli) {
                        lang.mixin(li, sli);
                    }
                });
            }
        },
        _applyLayerControlOptions: function (layer, controlOptions) {
            var esriLayerInfos = [];
            // only show the layers that are explicitly listed
            if (!controlOptions.includeUnspecifiedLayers && controlOptions.subLayerInfos && controlOptions.subLayerInfos.length !== 0) {            
                var subLayerInfos = array.map(controlOptions.subLayerInfos, function (sli) {
                    return sli.id;
                });
                array.forEach(layer.layerInfos, function (li) {
                    if (array.indexOf(subLayerInfos, li.id) !== -1) {
                        esriLayerInfos.push(li);
                    }
                });
            // show ALL layers except those in the excluded list
            } else if (controlOptions.excludedLayers) {
                array.forEach(layer.layerInfos, function (li) {
                    if (array.indexOf(controlOptions.excludedLayers, li.id) === -1) {
                        esriLayerInfos.push(li);
                    }
                });
            } else if (controlOptions.subLayerInfos) {
                // show ALL layers that are in the map service, but take care to override the properties of each subLayerInfo as configured
                this._mixinLayerInfos(layer.layerInfos, controlOptions.subLayerInfos);
                return;
            }
            // make sure to apply all the subLayerInfos that were defined to our new array of esri layer infos
            if (controlOptions.subLayerInfos) {
                this._mixinLayerInfos(esriLayerInfos, controlOptions.subLayerInfos);
            }
            layer.layerInfos = esriLayerInfos;        
        }
    };
    return _LayerControlOptionsHelper;
});