/*eslint strict: 0*/
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/topic',
    'esri/dijit/OverviewMap',
    'esri/layers/TiledMapServiceLayer',
    'esri/layers/OpenStreetMapLayer', 
    'esri/virtualearth/VETiledLayer',
    'esri/layers/ArcGISTiledMapServiceLayer',
    'esri/layers/ArcGISDynamicMapServiceLayer', 
    'esri/layers/ArcGISImageServiceLayer',
    'esri/layers/DynamicMapServiceLayer'
], function (declare, array, lang, topic, esriOverviewMap, TiledMapServiceLayer, OpenStreetMapLayer, VETiledLayer, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer, ArcGISImageServiceLayer, DynamicMapServiceLayer) {

    // main basemap widget
    return declare([esriOverviewMap], {
        overridenAfterLoad: false,
        _initialSetup: function () {
            this.inherited(arguments);    
        },
        _updateBaseMap: function (layers) {
            if (!this.overviewMap) {
                return;
            }
            this.overviewMap.removeAllLayers();
            for (var i = 0; i < layers.length; i++) {
                this.overviewMap.addLayer(this._cloneLayer(layers[i]));
            }
        },
        _syncBaseMap: function (args) {
            this._updateBaseMap(args.current.layers);
        },
        constructor: function (config) {
            this.inherited(arguments);
            if (config.syncBasemapChanges) {
                this.map.on('basemap-change', lang.hitch(this, '_syncBaseMap'));
            }
        },
        _initialize: function () {
            // after this, there is just one basemap, 
            // reset to include the rest
            this.inherited(arguments);
            if (!this.overviewMap) {
                return;
            }
            if (!this.overridenAfterLoad) {
                this.overridenAfterLoad = true;
                if (this.syncBasemapChanges) {
                    var baseMapLayers = [];
                    for (var i = 0; i < this.map.basemapLayerIds.length; i++) {
                        baseMapLayers.push(this.map.getLayer(this.map.basemapLayerIds[i]));
                    }
                    this._updateBaseMap(baseMapLayers);
                } else if (this.overviewLayers) {
                    this._initLayers();
                }
            }
        },
        _syncOverviewMap: function () {
            this.inherited(arguments);
        },
        _initLayers: function (returnWarnings) {
            this.layers = [];
            var layerTypes = {
                csv: 'CSV',
                dataadapter: 'DataAdapterFeature', //untested
                dynamic: 'ArcGISDynamicMapService',
                feature: 'Feature',
                georss: 'GeoRSS',
                image: 'ArcGISImageService',
                imagevector: 'ArcGISImageServiceVector',
                kml: 'KML',
                label: 'Label', //untested
                mapimage: 'MapImage', //untested
                osm: 'OpenStreetMap',
                raster: 'Raster',
                stream: 'Stream',
                tiled: 'ArcGISTiledMapService',
                vectortile: 'VectorTile',
                webtiled: 'WebTiled',
                wfs: 'WFS',
                wms: 'WMS',
                wmts: 'WMTS' //untested
            };
            // loading all the required modules first ensures the layer order is maintained
            var modules = [];
            array.forEach(this.overviewLayers, function (layer) {
                var type = layerTypes[layer.type];
                if (type) {
                    modules.push('esri/layers/' + type + 'Layer');
                } else {
                    returnWarnings.push('Layer type "' + layer.type + '" is not supported: ');
                }
            }, this);

            require(modules, lang.hitch(this, function () {
                array.forEach(this.overviewLayers, function (overviewLayer) {
                    var type = layerTypes[overviewLayer.type];
                    if (type) {
                        require(['esri/layers/' + type + 'Layer'], lang.hitch(this, '_initLayer', overviewLayer));
                    }
                }, this);
                this.overviewMap.addLayers(this.layers);
            }));
        },

        _initLayer: function (layerInfo, Layer) {
            var l;
            if (layerInfo.url) {
                l = new Layer(layerInfo.url, layerInfo.options);
            } else {
                l = new Layer(layerInfo.options);
            }
            this.layers.unshift(l); //unshift instead of push to keep layer ordering on map intact
            if (layerInfo.controlOptions && (layerInfo.type === 'dynamic' || layerInfo.type === 'feature')) {
                if (l.loaded) {
                    this._applyLayerControlOptions(layerInfo.controlOptions, l);
                } else {
                    l.on('load', lang.hitch(this, '_applyLayerControlOptions', layerInfo.controlOptions, l));
                }
            }
        },
        _applyLayerControlOptions: function (controlOptions, layer) {
            if (typeof controlOptions.includeUnspecifiedLayers === 'undefined' && typeof controlOptions.subLayerInfos === 'undefined' && typeof controlOptions.excludedLayers === 'undefined') {
                return;
            }            
            var esriLayerInfos = [];
            // Case 1: only show the layers that are explicitly listed
            if (!controlOptions.includeUnspecifiedLayers && controlOptions.subLayerInfos && controlOptions.subLayerInfos.length !== 0) {            
                var subLayerInfos = array.map(controlOptions.subLayerInfos, function (sli) {
                    return sli.id;
                });
                array.forEach(layer.layerInfos, function (li) {
                    if (array.indexOf(subLayerInfos, li.id) !== -1) {
                        esriLayerInfos.push(li);
                    }
                });
            // Case 2: show ALL layers except those in the excluded list
            } else if (controlOptions.excludedLayers) {
                array.forEach(layer.layerInfos, function (li) {
                    if (array.indexOf(controlOptions.excludedLayers, li.id) === -1) {
                        esriLayerInfos.push(li);
                    }
                });
            // Case 3: just override the values found in the subLayerInfos
            } else if (controlOptions.subLayerInfos) {
                // show ALL layers that are in the map service's layerInfos, but take care to override the properties of each subLayerInfo as configured
                this._mixinLayerInfos(layer.layerInfos, controlOptions.subLayerInfos);
                this._setSublayerVisibilities(layer);
                return;
            }
            // Finally, if we made use of the esriLayerInfos, make sure to apply all the subLayerInfos that were defined to our new array of esri layer infos
            if (controlOptions.subLayerInfos) {
                this._mixinLayerInfos(esriLayerInfos, controlOptions.subLayerInfos);
            }
            layer.layerInfos = esriLayerInfos;
            this._setSublayerVisibilities(layer);
        },
        _setSublayerVisibilities: function (layer) {
            var visibleIds = array.map(array.filter(layer.layerInfos, function (li) {
                return li.defaultVisibility;
            }), function (l) {
                return l.id;
            });
            layer.setVisibleLayers(visibleIds);  
        },
        _mixinLayerInfos: function (esriLayerInfos, subLayerInfos) {
            // for each of the sublayers, go through the subLayerInfos from the controlOptions and see if defaultVisiblity is set to true or false
            // then set each of the layer.layerInfos defaultVisibility appropriately
            // assume defaultVisibility is true if it's not defined
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
        _cloneLayer: function (sourceLayer) {
            var newLayer = sourceLayer,
                sourceDeclaredClass = sourceLayer.declaredClass;
            if (sourceLayer instanceof TiledMapServiceLayer) {
                if (sourceDeclaredClass === 'VETiledLayer') {
                    newLayer = new VETiledLayer({
                        resourceInfo: sourceLayer.getResourceInfo(),
                        culture: sourceLayer.culture,
                        mapStyle: sourceLayer.mapStyle,
                        bingMapsKey: sourceLayer.bingMapsKey
                    });
                } else if (sourceDeclaredClass === 'OpenStreetMapLayer') {
                    newLayer = new OpenStreetMapLayer({
                        tileServers: sourceLayer.tileServers
                    });
                } else if (sourceDeclaredClass === 'WebTiledLayer') {
                    var initialExtent = sourceLayer.initialExtent,
                        fullExtent = sourceLayer.fullExtent,
                        tileInfo = sourceLayer.tileInfo;
                    newLayer = new sourceLayer.constructor(sourceLayer.urlTemplate, {
                        initialExtent: initialExtent && new initialExtent.constructor(initialExtent.toJson()),
                        fullExtent: fullExtent && new fullExtent.constructor(fullExtent.toJson()),
                        tileInfo: tileInfo && new tileInfo.constructor(tileInfo.toJson()),
                        tileServers: sourceLayer.tileServers && sourceLayer.tileServers.slice(0)
                    });
                } else {
                    newLayer = new ArcGISTiledMapServiceLayer(sourceLayer.url, {
                        resourceInfo: sourceLayer.getResourceInfo()
                    });
                }
            } else if (sourceLayer instanceof DynamicMapServiceLayer) {
                if (sourceDeclaredClass === 'ArcGISImageServiceLayer') {
                    newLayer = new ArcGISImageServiceLayer(sourceLayer.url);
                } else {
                    newLayer = new ArcGISDynamicMapServiceLayer(sourceLayer.url);
                    newLayer.setImageFormat('png24');
                }
            } else {
                topic.publish('viewer/handleError', 'esri.dijit.OverviewMap: ' + this.NLS_invalidType);
            }
            return newLayer;
        }
    });
});