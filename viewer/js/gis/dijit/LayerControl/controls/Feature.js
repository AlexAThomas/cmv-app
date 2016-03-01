define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-style',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_Contained',
    './_Control', // layer control base class
    './../plugins/legendUtil'
], function (
    declare,
    lang,
    domStyle,
    _WidgetBase,
    _TemplatedMixin,
    _Contained,
    _Control,
    legendUtil
) {
    'use strict';

    var FeatureControl = declare([_WidgetBase, _TemplatedMixin, _Contained, _Control], {
        _layerType: 'vector', // constant
        _esriLayerType: 'feature', // constant
        // create and legend
        _layerTypeInit: function () {
            if (legendUtil.isLegend(this.controlOptions.noLegend, this.controller.noLegend)) {
                this._expandClick();
                legendUtil.vectorLegend(this.layer, this.expandNode);
            } else {
                this._expandRemove();
            }
            if (this.controlOptions.styleControlWhenEmpty) {
                this.controlHandler = this.layer.on("graphic-remove", lang.hitch(this, '_handleLayerControlVisibility'))
                this._handleLayerControlVisibility();
            }
        },
        _handleLayerControlVisibility: function() {
            if (this.layer.graphics.length == 0) {
                domStyle.set(this.domNode, "fontStyle", "italic");
                this.controlHandler.remove();
                this.controlHandler = this.layer.on("graphic-add", lang.hitch(this, '_handleLayerControlVisibility'))
            } else {
                domStyle.set(this.domNode, "fontStyle", "normal");
                this.controlHandler.remove();
                this.controlHandler = this.layer.on("graphic-remove", lang.hitch(this, '_handleLayerControlVisibility'))
            }
        },
        destroy: function () {
            this.inherited(arguments);
            this.controlHandler.remove()
        }
    });
    return FeatureControl;
});