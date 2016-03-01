define([
    'esri/urlUtils'
], function (
    urlUtils
) {
    'use strict';
    var _ConfigMixinHelper = {
        _mixinDeep: function (dest, source) { 
             //Recursively mix the properties of two objects
            var empty = {}; 
            for (var name in source) { 
                if (!(name in dest) || (dest[name] !== source[name] && (!(name in empty) || empty[name] !== source[name]))) {
                    try { 
                        if (source[name].constructor === Object) { 
                            dest[name] = this._mixinDeep(dest[name], source[name]); 
                        } else { 
                            dest[name] = source[name]; 
                        }
                    } catch (e) { 
                        // Property in destination object not set. Create it and set its value.
                        dest[name] = source[name]; 
                    }
                }
            } 
            return dest; 
        },    
        _createUrlParamsObject: function (items) {
            var urlObject, obj = {},
                i, url, matchTag = /<(?:.|\s)*?>/g;
            url = document.location.href;
            urlObject = urlUtils.urlToObject(url);
            urlObject.query = urlObject.query || {};
            if (urlObject.query && items && items.length) {
                for (i = 0; i < items.length; i++) {
                    var item = urlObject.query[items[i]];
                    if (item) {
                        //strip html tags 
                        item = item.replace(matchTag, '');
                        //if equal to 'true' or 'false' convert to true or false
                        if (item === 'true' || item === 'false') {
                            item = (item === 'true') ? true : false;
                        }
                        obj[items[i]] = item;
                    }
                }
            }
            return obj;
        }
    };
    return _ConfigMixinHelper;
});