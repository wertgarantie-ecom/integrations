/*
 * Gepackt mit http://refresh-sf.com/yui/
 *
 * Einstellungen:
 * Type = js
 * Preserve unnecessary semicolons = checked
 */
if (typeof(Adcell) == 'undefined') {
    var Adcell = {};
}

/**
 * objekt dass informationen aus dem user-rechner auslesen kann
 * @returns {AdcellUser}
 */
Adcell.Retargeting = function (){

    /**
     * auf welchem Host ADCELL läuft
     *
     * @var string
     */
    var hostname = 't.adcell.com';

    this.product = function(obj){
        obj.type = 'product';
        this.track(obj);
    };

    this.search = function(obj){
        obj.type = 'search';
        this.track(obj);
    };

    this.category = function(obj){
        obj.type = 'category';
        this.track(obj);
    };

    this.basket = function(obj){
        obj.type = 'basket';
        this.track(obj);
    };

    this.checkout = function(obj){
        obj.type = 'checkout';
        this.track(obj);
    };

    /**
     * tracken einer Transaktion
     * @param object obj
     */
    this.track = function(obj){
        var params = '';
        for(param in obj){
            params += "&" + encodeURIComponent(param) + "=" + encodeURIComponent(obj[param]);
        }
        var scr = document.createElement('script');
        scr.setAttribute('type', 'text/javascript');
        scr.setAttribute('async', '');
        scr.setAttribute('src', 'https://' + hostname + '/retargeting/track?' + params);
        document.body.appendChild(scr);
    };

    this.run = function () {
        try {
            var scriptElement = document.currentScript;
            var scriptSrc = scriptElement.src;
            var trackParams = {};

            if(scriptSrc.startsWith("//") === true) {
                scriptSrc = "https:" + scriptSrc
            }
            var url = new URL(scriptSrc);
            var method = url.searchParams.get('method');
        } catch (e) {
            return;
        }

        if (method === null) {
            return null;
        }

        var defaultMethods = {
            'track': [
                'pid',
                'type',
            ],
            'product': [
                'pid',
                'productId',
                'productName',
                'categoryId',
                'productIds',
                'productSeparator',
            ],
            'search': [
                'pid',
                'search',
                'productIds',
                'productSeparator',
            ],
            'category': [
                'pid',
                'categoryName',
                'categoryId',
                'productIds',
                'productSeparator',
            ],
            'basket': [
                'pid',
                'productIds',
                'quantities',
                'basketProductCount',
                'basketTotal',
                'productSeparator',
            ],
            'checkout': [
                'pid',
                'basketId',
                'basketTotal',
                'basketProductCount',
                'productIds',
                'quantities',
                'productSeparator',
            ],
        };

        var allParams = [
            'basketId',
            'basketProductCount',
            'basketTotal',
            'categoryId',
            'categoryName',
            'pid',
            'productId',
            'productIds',
            'productName',
            'productSeparator',
            'quantities',
            'search',
            'type',
        ];

        var paramsToUse = ((method) in defaultMethods) ? defaultMethods[method] : allParams;

        for (var i = 0; i < paramsToUse.length; i++) {

            try {
                var extractedParam = url.searchParams.get(paramsToUse[i]);
            } catch (e) {
                return;
            }

            if (extractedParam != null) {
                trackParams[paramsToUse[i]] = extractedParam;
            }
        }

        if (method !== 'track') {
            trackParams['type'] = method;
        }

        this.track(trackParams);
    }
};

Adcell.retargeting = new Adcell.Retargeting();
Adcell.retargeting.run();
