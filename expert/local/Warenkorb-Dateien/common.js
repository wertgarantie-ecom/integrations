function generateUUID() { // Public Domain/MIT
	var d = new Date().getTime();
	if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
		d += performance.now(); // use high-precision timer if available
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (d + Math.random() * 16) % 16 | 0;
		d = Math.floor(d / 16);
		return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
}

// TODO: this might be project specific - we don't have a project specific js file yet
$.datepicker.setDefaults({
	dateFormat : "dd.mm.yy",
	changeYear : true,
	monthNames : [ 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember' ],
	monthNamesShort : [ 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez' ],
	dayNames : [ 'Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag' ],
	dayNamesShort : [ 'So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa' ],
	dayNamesMin : [ 'So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa' ]
});
if(typeof $.timepicker == 'function') {
	$.timepicker.setDefaults({
		format : 'dd.mm.yy hh:MM'
	});
}
var projectColors = [ 'E04806', 'FF5E19', '2B2B2B', '5F79A7', '6D6D6D', '8B8B8B', 'B4B4B4', 'CFCFCF', 'D9D9D9', 'EBEBEB', 'E4E4E4', 'E5E5E5', 'F2F2F2', 'F7F8F9', 'F8F8F8', 'FFFFFF' ];

var defaultErrorMessage = 'Es ist ein Fehler aufgetreten.';
var defaultErrorDisplayTime = 15;
var defaultWarningDisplayTime = 10;
var defaultSuccessDisplayTime = 10;

var CSRF_TOKEN_PARAM = "csrf-token";

var csrfToken = $('meta[name=' + CSRF_TOKEN_PARAM + ']').attr('content')

var clearCsrfToken = function() {
	csrfToken = null;
};
var setCsrfToken = function(token) {
	csrfToken = token;
};

var addCsrfTokenHeader = function(params) {
	if (csrfToken != null) {
		if (typeof params.headers != 'object') params.headers = {};
		params.headers[CSRF_TOKEN_PARAM] = csrfToken;
	}
};

;(function() {
	$.originalAjax = $.ajax;
	var fetchCSRFToken = function() {
		return $.originalAjax({
			url : '/_api/user/getCsrfToken',
			type : 'GET',
		});
	};

	$.ajax = function() {
		var args = arguments;
		var deferred = $.Deferred();
		var that = deferred;

		var parameterObject = arguments[0];
		if (typeof parameterObject != 'object') parameterObject = {};

		addCsrfTokenHeader(parameterObject)

		var orgError = parameterObject.error;
		var orgSuccess = parameterObject.success;
		var orgComplete = parameterObject.complete;
		delete parameterObject.error;
		delete parameterObject.success;
		delete parameterObject.complete;
		if (typeof parameterObject.context != "undefined") that = parameterObject.context;
		if (typeof orgSuccess == "function") deferred.done(orgSuccess);
		if (typeof orgError == "function") deferred.fail(orgError);
		if (typeof orgComplete == "function") deferred.always(orgComplete);

		var doRequest = function(retry) {
			return $.extend($.originalAjax.apply(that, args).done(function() {
				deferred.resolve.apply(that, arguments);
			}).fail(function(xhr, status, error) {
				if (
					retry 
					&& typeof xhr.responseJSON != "undefined" 
					&& xhr.responseJSON.namespace == 'global' 
					&& xhr.responseJSON.errorcode == 4403
				) {
					fetchCSRFToken().done(function(data) {
						if (typeof data.csrfToken == 'string') csrfToken = data.csrfToken;
						doRequest(false);
					});
				} else deferred.reject.apply(that, arguments);
			}), deferred);
		}

		return doRequest(true);
	};

	var errorSuppressor = function(event, xhr, settings, thrownError) {
		if (
			typeof xhr.responseJSON != "undefined" 
			&& xhr.responseJSON.namespace == 'global' 
			&& xhr.responseJSON.errorcode == 4403 
			&& typeof xhr.responseJSON.validCsrfToken == 'string'
		) {
			event.stopImmediatePropagation();
		}
	};

	$(document).ajaxError(errorSuppressor);
	var documentEvents = $._data(document, "events");
	var ajaxErrorHandlers = documentEvents.ajaxError;
	for (var i = 0; i < ajaxErrorHandlers.length; i++) {
		if (ajaxErrorHandlers[i].handler == errorSuppressor) {
			var eventRegitration = ajaxErrorHandlers.splice(i, 1)[0];
			ajaxErrorHandlers.unshift(eventRegitration);
			break;
		}
	}
})();

;(function() {
	// heartbeat
	setInterval(function() {
		$.ajax({
			url : '/_api/user/heartbeat',
			contentType : 'application/json; charset=utf-8',
			dataType : 'json',
			type : 'POST',
			data : JSON.stringify({})
		});
	}, 600000);
})();

;(function() {
	/* browser detection start */
	var classToAdd = "";

	// Firefox 1.0+
	if (typeof InstallTrigger !== 'undefined') {
		classToAdd += "isFirefox ";
	}

	// Chrome 1+
	if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
		classToAdd += "isChrome ";
		var isChrome = true;
	}

	// Safari 3.0+ "[object HTMLElementConstructor]"
	if (/constructor/i.test(window.HTMLElement) || (function(p) {
		return p.toString() === "[object SafariRemoteNotification]";
	})(!window['safari'] || safari.pushNotification)) {
		classToAdd += "isSafari ";
	}

	// Opera 8.0+
	if ((!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) {
		classToAdd += "isOpera ";
		var isOpera = true;
	}

	// Internet Explorer 6-11
	if (/* @cc_on!@ */false || !!document.documentMode) {
		classToAdd += "isIE ";
		var isIE = true;
	}

	// Edge 20+
	if (!isIE && !!window.StyleMedia) {
		classToAdd += "isEdge ";
	}

	// Blink engine detection
	if ((isChrome || isOpera) && !!window.CSS) {
		classToAdd += "isBlink ";
	}

	function isIPhone() {
		return ((navigator.userAgent.indexOf('iPhone') != -1) || (navigator.userAgent.indexOf('iPod') != -1));
	}
	function isIPad() {
		return (navigator.userAgent.indexOf('iPad') != -1);
	}
	function isAndroidTab() {
		return ((navigator.userAgent.indexOf('Android') != -1) && ((navigator.userAgent.indexOf('Tablet') != -1) || !(navigator.userAgent.indexOf('Mobile') != -1)));
	}
	function isAndroidPhone() {
		return ((navigator.userAgent.indexOf('Android') != -1) && ((navigator.userAgent.indexOf('Mobile') != -1)));
	}
	function isWindowsPhone1() {
		return ((navigator.userAgent.indexOf('Windows Phone') != -1));
	}
	function isWindowsPhone() {
		return ((navigator.userAgent.indexOf('IEMobile') != -1));
	}
	function isBlackBerryPhone() {
		return ((navigator.userAgent.indexOf('BlackBerry') != -1));
	}

	if (isIPhone() || isIPad()) {
		classToAdd += "isIOS ";
	}

	checkMobile = function() {
		return isIPhone() || isIPad() || isAndroidTab() || isAndroidPhone() || isWindowsPhone1() || isWindowsPhone() || isBlackBerryPhone();
	}

	$(document).ready(function() {
		$('body').addClass(classToAdd);
		$('.pageWrapper').addClass(classToAdd);
	});
	/* browser detection end */
})();

;(function() {
	var ua = navigator.userAgent.toLowerCase().replace(/\s+/, '');

	var matchers = {
		winXP : /(windows nt 5.1|windows xp)/,
		winVista : /windows nt 6.0/,
		win7 : /windows nt 6.1/,
		win8 : /(windows nt 6.2|windows nt 6.3)/,
		win10 : /windows nt 10.0/
	};

	$(document).ready(function() {
		var b = $('body');

		for (i in matchers) {
			var m = matchers[i];
			if ((typeof (m) == "object" && ua.match(m))) {
				b.addClass(i)
			}
		}
	});
})();

// it merely reverses the order of a jQuery set.
$.fn.reverse = function() {
	return this.pushStack(this.get().reverse(), arguments);
};

// create two new functions: prevALL and nextALL. they're very similar, hence this style.
$.each([ 'prev', 'next' ], function(unusedIndex, name) {
	$.fn[name + 'ALL'] = function(matchExpr) {
		// get all the elements in the body, including the body.
		var $all = $('body').find('*').andSelf();

		// slice the $all object according to which way we're looking
		$all = (name == 'prev') ? $all.slice(0, $all.index(this)).reverse()
				: $all.slice($all.index(this) + 1);
		// filter the matches if specified
		if (matchExpr)
			$all = $all.filter(matchExpr);
		return $all;
	};
});

if (typeof window.history.replaceState != "function") window.history.replaceState = window.history.pushState

	// default colors for tinyMCE and spectrum color map
var defaultColors = [ "000000", "Black", "993300", "Burnt orange", "333300",
		"Dark olive", "003300", "Dark green", "003366", "Dark azure", "000080",
		"Navy Blue", "333399", "Indigo", "333333", "Very dark gray", "800000",
		"Maroon", "FF6600", "Orange", "808000", "Olive", "008000", "Green",
		"008080", "Teal", "0000FF", "Blue", "666699", "Grayish blue", "808080",
		"Gray", "FF0000", "Red", "FF9900", "Amber", "99CC00", "Yellow green",
		"339966", "Sea green", "33CCCC", "Turquoise", "3366FF", "Royal blue",
		"800080", "Purple", "999999", "Medium gray", "FF00FF", "Magenta",
		"FFCC00", "Gold", "FFFF00", "Yellow", "00FF00", "Lime", "00FFFF",
		"Aqua", "00CCFF", "Sky blue", "993366", "Red violet", "FFFFFF",
		"White", "FF99CC", "Pink", "FFCC99", "Peach", "FFFF99", "Light yellow",
		"CCFFCC", "Pale green", "CCFFFF", "Pale cyan", "99CCFF",
		"Light sky blue", "CC99FF", "Plum" ]

var tinyMCE_color_map = [];
for (var i = 0; i < defaultColors.length; i = i + 2) {
	if (i / 2 + projectColors.length < 40) {
		tinyMCE_color_map.push(defaultColors[i]);
		if (defaultColors.length > i) tinyMCE_color_map.push(defaultColors[i + 1]);
	}
}
for (var i = 0; i < projectColors.length; i++) {
	tinyMCE_color_map.push(projectColors[i]);
	tinyMCE_color_map.push(projectColors[i]);
}

var defaultSpectrumColors = [];
;(function() {
	var colors = [];
	for (var i = 0; i < defaultColors.length; i++) {
		if (i % 2 == 0) colors.push(defaultColors[i])
	}
	defaultSpectrumColors.push(colors);
	defaultSpectrumColors.push(projectColors);
})();

;
(function() {
	// show element with animation
	$.fn.showAnimated = function(animation, speed) {
		if (typeof speed == 'undefined') speed = 'fast';
		var $element = this.show();

		switch (animation) {
			case $.fn.showAnimated.animation.SLIDE_IN_DOWN:
				$element.css({
					'opacity' : '0',
					'margin-top' : '-50px'
				}).animate({
					'opacity' : '1',
					'margin-top' : '0px'
				}, speed);
			break;
			case $.fn.showAnimated.animation.SLIDE_IN_UP:
				$element.css({
					'opacity' : '0',
					'margin-top' : '50px'
				}).animate({
					'opacity' : '1',
					'margin-top' : '0px'
				}, speed);
			break;
			case $.fn.showAnimated.animation.SLIDE_IN_LEFT:
				$element.css({
					'opacity' : '0',
					'margin-left' : '-100px'
				}).animate({
					'opacity' : '1',
					'margin-left' : '0px'
				}, speed);
			break;
			case $.fn.showAnimated.animation.SLIDE_IN_RIGHT:
				$element.css({
					'opacity' : '0',
					'margin-left' : '100px'
				}).animate({
					'opacity' : '1',
					'margin-left' : '0px'
				}, 'slow');
			break;
			case $.fn.showAnimated.animation.FADE_IN:
				$element.css({
					'opacity' : '0'
				}).animate({
					'opacity' : '1'
				}, speed);
			break;
			case $.fn.showAnimated.animation.SHRINK_IN:
				var height = $element.outerHeight();
				var width = $element.outerWidth();
				$element.css({
					'opacity' : '0',
					'margin-left' : '-' + width / 4 + 'px',
					'margin-top' : '-' + height / 4 + 'px',
					'width' : width * 2,
					'height' : height * 2
				});
				setTimeout(function() {
					$element.animate({
						'opacity' : '1',
						'margin-left' : '0',
						'margin-top' : '0',
						'width' : width,
						'height' : height
					}, speed, undefined, function() {
						$element.css('height', 'auto');
					});
				}, 0);
			break;
			case $.fn.showAnimated.animation.EXPAND_IN:
				var height = $element.outerHeight();
				var width = $element.outerWidth();
				$element.css({
					'opacity' : '0',
					'margin-left' : width / 8,
					'margin-top' : height / 8,
					'width' : width / 2,
					'height' : height / 2
				});
				setTimeout(function() {
					$element.animate({
						'opacity' : '1',
						'margin-left' : '0',
						'margin-top' : '0',
						'width' : width,
						'height' : height
					}, speed, undefined, function() {
						$element.css('height', 'auto');
					});
				}, 0);
			break;
			default:
			break;
		}

		return $element;
	};

	$.fn.showAnimated.animation = {};
	var animationArray = [ 'NONE', 'SLIDE_IN_DOWN', 'SLIDE_IN_UP', 'SLIDE_IN_LEFT', 'SLIDE_IN_RIGHT', 'FADE_IN', 'SHRINK_IN', 'EXPAND_IN' ];
	for (var i = 0; i < animationArray.length; i++) {
		$.fn.showAnimated.animation[animationArray[i]] = animationArray[i];
	}
})();

// declare console if not exists
if (typeof console == "undefined") console = {};
if (typeof console.log == "undefined") console.log = function() {};
if (typeof console.warn == "undefined") console.warn = function() {};
if (typeof console.error == "undefined") console.error = function() {};
if (typeof console.debug == "undefined") console.debug = function() {};
if (typeof console.trace == "undefined") console.trace = function() {};

// get widget parent id list jQuery plugin
$.fn.getParentWidgetIdList = function() {
	var $this = this;
	if ($this.length > 1) {
		console.warn('Called $.fn.getParentWidgetIdList on more than single element. Returning parent widget id list of first element');
		$this = $this.first();
	}
	var widgetParentIdList = [];
	var $list = $this.parents('.widget').reverse();
	if ($this.hasClass('widget')) $list = $list.add($this);
	$list.each(function(i, v) {
		var $v = $(v);
		widgetParentIdList.push($v.attr('data-widget-id') + "::" + $v.attr('data-subwidget-id'));
	});
	return widgetParentIdList;
};

//get widget by parent id list jQuery plugin (getParentWidgetIdList reverse)
$.findWidgetByIdList = function(idList){
	if(typeof idList == 'string') idList = idList.split('.');
	var $widget = $(document);
	for(var i = 0; i < idList.length; i++) {
		var split = idList[i].split('::');
		var selector = '.widget[data-widget-id="' + split[0] + '"]';
		var subWidgetId = undefined;
		if(split.length > 1 && split[1] != typeof undefined) selector = selector + '[data-subwidget-id="' + split[1] + '"]';
		$widget = $widget.find(selector);
	}
	return $widget
}

// get closest joint ancestor off all elements
$.fn.closestAncestor = function(selector) {
	if (this.length < 2) return this;
	var $this = this;

	if (typeof selector == 'undefined') selector = '*';
	var $ancestor;
	var missing = false;
	$this.each(function() {
		if ($(this).is(selector)) {
			$ancestor = $(this);
			missing = false;
			$this.each(function() {
				if ($ancestor.has(this).length == 0 && !$ancestor.is(this)) {
					missing = true;
					return false;
				}
			});
			if (!missing) return false;
		}
	});

	if (missing) this.eq(0).parentsUntil().each(function() {
		if ($(this).is(selector)) {
			$ancestor = $(this);
			missing = false;
			$this.each(function() {
				if ($ancestor.has(this).length == 0 || $ancestor.is(this)) {
					missing = true;
					return false;
				}
			});
			if (!missing) return false;
		}
	});

	if (!missing)
		return $ancestor;
	else
		return $();
};

// reload widget jQuery plugin -> get closest widget and reload it
;(function() {
	var getReloadParent = function($element) {
		var reloadId = $element.data('reload-id');
		if (reloadId) {
			var $reloadParent = $element.closest('.widget[data-widget-id="' + reloadId + '"]');
			if ($reloadParent.length > 0) return $reloadParent;
		}
		return $element;
	}

	var beforeCallbacks = [];
	var successCallback = [];
	var reloadingList = {};
	var $delayReloadList = $();
	
	var delayedExecute = function($widget, exe){
		var isDelay = false;
		$delayReloadList.each(function(){
			var that = this;
			$widget.each(function(){
				if($(this).is(that) || $.contains(this, that)) {
					isDelay = true;
					return false;
				}
			});
			if(isDelay) return false;
		});
		
		if(isDelay) setTimeout(function(){
			delayedExecute($widget, exe);
		}, 100);
		else if(typeof exe == 'function') exe();
	}

	$.fn.reloadWidget = function(callback, strict, parameter) {
		if (typeof strict == "undefined") strict = false;
		if (typeof parameter == "undefined") parameter = {};
		var $widgetList = $();
		if (strict) $widgetList = this;
		else {
			var widgetIdList = [];
			this.each(function() {
				widgetIdList.push($(this).closest('.widget[data-widget-id]').data('widget-id'));
			});
			widgetIdList.forEach(function(item) {
				$widgetList = $widgetList.add($('.widget[data-widget-id="' + item + '"]'));
			});
		}

		var $wl = $();
		$widgetList.each(function() {
			$wl = $wl.add(getReloadParent($(this)));
		});
		var $widget = getReloadParent($wl.closestAncestor('.widget[data-widget-id]'));

		if ($widget.length > 0) {
			$widget.loaderShow();
			
			var reloading = [$widget.data('widget-id')];
			$widget.find('.widget[data-widget-id]').each(function(){
				reloading.push($(this).data('widget-id'))
			});
			var reloadingId = generateUUID();
			reloadingList[reloadingId] = reloading;
			
			var additionalReloadParameter = $widget.closest('.additional-reload-parameter').data('additional-reload-parameter');
			if (typeof additionalReloadParameter == 'undefined') additionalReloadParameter = {};
			if ($widget.closest('.widget-Popup').length > 0) additionalReloadParameter['popup_open'] = $widget.closest('.widget-Popup').data('widget-id');

			for (var i = 0; i < beforeCallbacks.length; i++) {
				if (typeof beforeCallbacks[i] == 'function') beforeCallbacks[i].apply($widget, []);
			}

			if (window.backend) return $.ajax({
				url : '/_api/cms/renderWidget' + window.location.search,
				type : 'POST',
				dataType : 'json',
				data : $.extend(parameter, additionalReloadParameter, {
					widgetParentIdList : $widget.getParentWidgetIdList()
							.join('.'),
					widgetConfigId : $widget.attr('[data-widget-id]'),
					renderMode : window.backend.renderMode,
					renderTime : getRenderTime()
				}),
				success : function(data) {
					$.fn.reloadWidget._success(data, $widget, callback, reloadingId);
				}
			});

			else return $.ajax({
				url : window.location.href,
				type : 'post',
				data : $.extend(parameter, additionalReloadParameter, {
					widgetParentIdList : $widget.getParentWidgetIdList()
							.join('.')
				}),
				success : function(data) {
					$.fn.reloadWidget._success(data, $widget, callback, reloadingId);
				}
			});

		} else {
			this.trigger('reloadWidgetError', [ callback ]);
			if (typeof console == 'object') console.warn('called $.fn.reloadWidget on none widget');
			return false;
		}
		return this;
	};

	$.fn.reloadWidget.addBeforeCallback = function(callback) {
		beforeCallbacks.push(callback);
	};
	$.fn.reloadWidget.removeBeforeCallback = function(callback) {
		for(var i = beforeCallbacks.length - 1; i > -1; i--) {
			if(callback.toString() == beforeCallbacks[i].toString()) beforeCallbacks.splice(i, 1);
		}
	};
	$.fn.reloadWidget.getBeforeCallback = function() {
		return beforeCallbacks;
	}
	$.fn.reloadWidget.addSuccessCallback = function(callback) {
		successCallback.push(callback);
	};
	$.fn.reloadWidget.removeSuccessCallback = function(callback) {
		for(var i = successCallback.length - 1; i > -1; i--) {
			if(callback.toString() == successCallback[i].toString()) successCallback.splice(i, 1);
		}
	};
	$.fn.reloadWidget.getSuccessCallback = function() {
		return successCallback;
	}
	$.fn.reloadWidget.delayReload = function($widget) {
		$delayReloadList = $delayReloadList.add($widget);
	}
	$.fn.reloadWidget.proceedReload = function($widget) {
		$delayReloadList = $delayReloadList.not($widget);
	}
	$.fn.reloadWidget.isReloading = function(widgetId) {
		for(var key in reloadingList) {
			for(var i = 0; i < reloadingList[key].length; i++) {
				if(reloadingList[key][i] == widgetId) return true;
			}
		}
		return false;
	}
	$.fn.reloadWidget._success = function(data, $widget, callback, reloadingId) {
		delayedExecute($widget, function(){
			var $newWidget = $();
			if (data.markup && $widget.closest(document.documentElement).length > 0) {
				if (typeof window.backend != 'undefined' && window.backend.renderMode == 'MAIL_TEXT') {
					$widget.replaceWith(data.markup);
				} else {
					$newWidget = $(data.markup);
					var $focus = $widget.find('.focus[data-widget-id]');
					$widget.replaceWith($newWidget);
					placeScripts(data.scripts, function() {
						placeHead(data.headRegion);
						if ($widget.is('.focus')) $newWidget.addClass('focus');
						$focus.each(function() {
							var $this = $(this);
							var selector = '[data-widget-id="' + $this.data('widget-id') + '"]';
							if ($this.is('[data-subwidget-id]')) {
								selector += '[data-subwidget-id="' + $this.data('subwidget-id') + '"]';
							}
							var $focused = $newWidget.find(selector);
							$widget.find(selector).each(function(i, element) {
								if ($(this).is('.focus') && $focused.length > i) $focused.eq(i).addClass('focus');
							});
						});
					});
				}
			}
			if(reloadingId) delete reloadingList[reloadingId];
			for (var i = 0; i < successCallback.length; i++) {
				if (typeof successCallback[i] == 'function') successCallback[i].apply($newWidget, [ data ]);
			}
			if (typeof callback == 'function') callback.apply($newWidget, [ data ]);
		});
	};
})();

;(function() {
	var reloadEvent = function(e) {
		setTimeout(function() {
			if (e.widgetList) {
				var callback = function() {
					if (e.widgetCallback) for (var i = 0; i < e.widgetCallback.length; i++) {
						e.widgetCallback[i].apply($(this), arguments);
					}
				}
				var $reloadList = $();
				e.widgetList.each(function() {
					var $popup = $(this).closest('.widget-Popup');
					if ($popup.length == 0) $reloadList = $reloadList.add(this);
					else if ($popup.is(':visible')) $(this).reloadWidget(callback, true);
				});
				if ($reloadList.length > 0) $reloadList.reloadWidget(callback);
			}
		});
	};
	$(document).off("reload.widget.checkout.articleList.action");
	$(document).on("reload.widget.checkout.articleList.action", reloadEvent);
	$(document).off("reload.widget.customer.login.action");
	$(document).on("reload.widget.customer.login.action", reloadEvent);
	$(document).off("reload.widget.articleList.viewTypeSwitch.action");
	$(document).on("reload.widget.articleList.viewTypeSwitch.action", reloadEvent);
	$(document).off("reload.widget.checkout.deliveryaddress.action");
	$(document).on("reload.widget.checkout.deliveryaddress.action", reloadEvent);
	$(document).off("reload.widget.checkout.address.action");
	$(document).on("reload.widget.checkout.address.action", reloadEvent);
	$(document).off("checkout.shippingbin.shippingoptionset.change.reload");
	$(document).on("checkout.shippingbin.shippingoptionset.change.reload", reloadEvent);
	$(document).off("reload.widget.checkout.sum.action");
	$(document).on("reload.widget.checkout.sum.action", reloadEvent);
	/* USED FOR WIDGETS IN CUSTOMER PROJECT */
	$(document).off("reload.widget.filter.refresh.action");
	$(document).on("reload.widget.filter.refresh.action", reloadEvent);

})();

// loader plugin
;(function() {
	var loader = '<div class="btLoader">\
		<div class="btLoaderContent">\
			<div class="btLoader-overlay"></div>\
			<img class="lazy" />\
		</div>\
	</div>';
	$.fn.loaderShow = function() {
		if(this.length > 0) {
			var $loader = this.children('.btLoader:first').children('.btLoaderContent');
			if ($loader.length == 0) {
				this.prepend(loader);
				$loader = this.children('.btLoader:first').children('.btLoaderContent');
			}
			$loader.css({
				width : this.outerWidth(),
				height : this.outerHeight(),
				'margin-left' : '-' + this.css('padding-left'),
				'margin-top' : '-' + this.css('padding-top')
			});
			setLoaderPosition.apply($loader.find('.btLoader-overlay').get(0), [ $(window).height() ]);
		}
		return this;
	};
	$.fn.loaderHide = function() {
		this.children('.btLoader').remove();
		return this;
	};
	$.fn.loaderToggle = function() {
		var $loader = this.children('.btLoader');
		if ($loader.length == 0) this.loaderShow();
		else this.loaderHide();
		return this;
	};

	var setLoaderPosition = function(H) {
		var r = this.getBoundingClientRect(), t = r.top, b = r.bottom;
		var half = Math.max(0, t > 0 ? Math.min($(this).outerHeight(), H - t) : Math.min(b, H)) / 2;
		$(this).siblings('img').css('top', (t < 0 ? t * -1 + half + Math.min(b, 0) : half));
	}

	$(window).off("scroll.bt.loader, resize.bt.loader").on("scroll.bt.loader, resize.bt.loader", function() {
		var H = $(window).height();
		$('.btLoader-overlay').each(function() {
			setLoaderPosition.apply(this, [ H ]);
		});
	});
})();

;
(function() {
	var formValidity = function() {
		$(document).ready(function() {
			$('form').validateFormMail();

			$('select, input, textarea').off('invalid.errorHighlighting');
			$('select, input, textarea').on('invalid.errorHighlighting', function() {
				var $this = $(this);
				$this.addClass('error');
				if ($this.is('select')) {
					var $next = $this.next();
					if ($next.is('.select2')) $next.addClass('error');
				}
			});
			$('select, input, textarea').off('change.errorHighlighting');
			$('select, input, textarea').on('change.errorHighlighting', function() {
				var $this = $(this);
				var thisIsInvalid = $this.is(':invalid');
				if (thisIsInvalid) $this.addClass('error');
				else $this.removeClass('error');

				if ($this.is('select')) {
					var $next = $this.next();
					if ($next.is('.select2')) {
						if (thisIsInvalid) $next.addClass('error');
						else $next.removeClass('error');
					}
				}
			});
		});
	};
	formValidity();

	placeScripts = function(scripts, callback) {
		var placeScriptError = 'placeScripts error occured';
		var scriptList = [];
		formValidity();
		$('[widget\\\:location]').removeAttr('widget:location')

		if (typeof scripts != 'undefined') {
			if (typeof scripts['HEAD'] != 'undefined') {
				var $script
				var textarea = document.createElement('textarea');
				for (var i = 0; i < scripts['HEAD'].length; i++) {
					if (scripts['HEAD'][i].script) {
						$script = $('script');
						var found = false;
						textarea.innerHTML = scripts['HEAD'][i].script;
						var scriptString = textarea.value;
						$script.each(function() {
							textarea.innerHTML = this.outerHTML
							if (textarea.value == scriptString) {
								found = true;
								$script = $script.not(this);
								return false;
							}
						});
						if (!found) {
							var src = $(scripts['HEAD'][i].script).attr('src');
							if (src) {
								if (placeScripts.loadedScripts.indexOf(src) < 0) {
									placeScripts.loadedScripts.push(src);
									scriptList.push($.ajax({
										url: src,
										dataType: "script", 
										cache: true
									}));
								}
							} else {
								try {
									$('head').append(scripts['HEAD'][i].script);
								} catch (err) {
									console.error(placeScriptError, err);
								}
							}
						}
					}
				}
			}
			var execNonHeadScript = function(key) {
				for (var i = 0; i < scripts[key].length; i++) {
					if (scripts[key][i].script) {
						try {
							$('body').append(scripts[key][i].script);
						} catch (err) {
							console.error(placeScriptError, err);
						}
					}
				}
			};
			var calledCallback = false;
			var callCallback = function(){
			    if(calledCallback)return;
				if (typeof scripts['GLOBAL_BEFORE'] != 'undefined') execNonHeadScript('GLOBAL_BEFORE');
				if (typeof scripts['LOCAL'] != 'undefined') execNonHeadScript('LOCAL');
				if (typeof scripts['GLOBAL_AFTER'] != 'undefined') execNonHeadScript('GLOBAL_AFTER');
				if(typeof callback == 'function') callback();
				calledCallback = true;
			}
			$.when.apply($, scriptList).always(callCallback);
			if(!calledCallback) setTimeout(callCallback, 10000);
		}
	}
	placeScripts.loadedScripts = [];
})();

function placeHead(head) {
	if (typeof head != 'undefined') {
		try {
			var $currentHeader
			$(head).each(function() {
				if (this.nodeType != document.TEXT_NODE && this.nodeType != document.COMMENT_NODE) {
					$currentHeader = $('head').children();
					var html = this.outerHTML;
					var found = false;
					$currentHeader.each(function() {
						if (html == this.outerHTML) {
							found = true;
							$currentHeader = $currentHeader.not(this);
							return false;
						}
					});
					if (!found) $('head').append(this);
				}
			});
		} catch (a) {
			if (typeof console == 'object') console.warn('placeHead: parameter head could not be processed (' + head + ')');
		}
	}
}

function getURLParameter(name) {
	return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [ , "" ])[1].replace(/\+/g, '%20')) || null;
}

function removeParam(parameter, replaceState, url, dontAssignUrl, skipEncoding) {
	if (!url) url = document.location.href;
	var urlparts = url.split('?');

	if (urlparts.length >= 2) {
		var urlBase = urlparts.shift();
		var queryString = urlparts.join("?");

		var prefix = '';
		if (skipEncoding) {
			if (Array.isArray(parameter) && parameter.length == 2) prefix = parameter[0] + '=' + parameter[1];
			else prefix = parameter + '='
		} else {
			if (Array.isArray(parameter) && parameter.length == 2) prefix = encodeURIComponent(parameter[0]) + '=' + encodeURIComponent(parameter[1]);
			else prefix = encodeURIComponent(parameter) + '='
		}
		var pars = queryString.split(/[&]/g);

		for (var i = pars.length; i-- > 0;) {
			if (pars[i].indexOf(prefix) === 0) pars.splice(i, 1);
			if (pars.length !== 0) url = urlBase+'?'+pars.join('&');
			else url = urlBase;
			
			if(!dontAssignUrl) {
				if(replaceState && typeof history.replaceState == "function") window.history.replaceState('', document.title, url);
				else window.history.pushState('',document.title,url);
			}
		}
	}
	return url;
}

var insertURLParam = function(key, value, overwrite, replaceState) {
	var set = function(url) {
		if (replaceState && typeof history.replaceState == "function") window.history.replaceState(null, null, url);
		else window.history.pushState(null, null, url);
	}

	if (typeof overwrite == 'undefined') overwrite = true;
	key = encodeURI(key);
	value = encodeURI(value);
	var kvp = document.location.search.substr(1).split('&');
	if (kvp == '') set('?' + key + '=' + value);
	else if (!overwrite) set(document.location.search + '&' + key + '=' + value);
	else {
		var i = kvp.length;
		var x;
		while (i--) {
			x = kvp[i].split('=');
			if (x[0] == key) {
				x[1] = value;
				kvp[i] = x.join('=');
				break;
			}
		}
		if (i < 0) kvp[kvp.length] = [ key, value ].join('=');
		set('?' + kvp.join('&'));
	}
};

var getAllURLParameter = function(paramName) {
	var sURL = window.document.URL.toString();
	var value = [];
	var index = sURL.indexOf("?");
	var length = undefined;
	var indexOfHash = sURL.indexOf("#")
	if (indexOfHash > -1) length = sURL.length - (sURL.length - indexOfHash + 1) - index
	if (index >= 0) {
		var arrParams = sURL.substr(index + 1, length);
		var arrURLParams = arrParams.split("&");
		var paramPrefix = paramName + "=";
		for (var i = 0; i < arrURLParams.length; i++) {
			var param = arrURLParams[i];
			if (param.indexOf(paramPrefix) == 0) {
				value.push(param.substr(paramPrefix.length));
			}
		}
	}
	return value;
};

var getURLParameterThatStartsWith = function(paramName, start) {
	var value = getAllURLParameter(paramName);
	for (var i = 0; i < value.length; i++) {
		if (decodeURIComponent(value[i]).startsWith(start)) {
			return decodeURIComponent(value[i]);
		}
	}
};

var getURLParameterObject = function() {
	var returnValue = {};
	if (window.location.search.length > 0) {
		var params = window.location.search.substr(1).split('&');
		for (var i = 0; i < params.length; i++) {
			var equalPosition = params[i].indexOf('=');
			if (equalPosition < 0) equalPosition = params[i].length;
			returnValue[params[i].slice(0, equalPosition)] = params[i].slice(equalPosition + 1);
		}
	}
	return returnValue;
};

$.fn.validateFormMail = function() {
	this.off('submit.emailValidity');
	this.on('submit.emailValidity', function(e) {
		var stopPropagation = false;
		$(this).find('input[type="email"]:visible').each(function() {
			var val = $(this).val();
			if ($(this).prev().is('.globalEmailValidity')) $(this).prev().remove();
			if (val != '' && (val.search(/\S+@\S+\.\S{2,}/) < 0 || val.indexOf('..') >= 0)) {
				$(this).before('<span class="error globalEmailValidity">Ungültige E-Mail</span>');
				$(this).addClass('error');
				stopPropagation = true;
			}
		});
		if (stopPropagation) {
			e.stopImmediatePropagation();
			return false;
		}
	});
	return this;
};

function dateFormat(date, formatString, ignoreLocale) {
	if (date === null) return null;
	else if (typeof date === "number") {
		var dateObject = "";
		var dateObjectClient = new Date(date);
		if (ignoreLocale) dateObjectClient = new Date(dateObjectClient.getTime());
		else dateObjectClient = new Date(dateObjectClient.getTime() - (dateObjectClient.getTimezoneOffset() * 1000 * 60));
		var month = (dateObjectClient.getMonth() + 1) < 10 ? ("0" + (dateObjectClient.getMonth() + 1)) : dateObjectClient.getMonth() + 1;
		var fullYear = dateObjectClient.getFullYear();
		var year = fullYear.toString().substring(2)
		var day = dateObjectClient.getDate() < 10 ? ("0" + dateObjectClient.getDate()) : dateObjectClient.getDate();
		var hour = dateObjectClient.getHours() < 10 ? ("0" + dateObjectClient.getHours()) : dateObjectClient.getHours();
		var hour12 = (hour > 11 ? hour - 12 : hour);
		var minute = dateObjectClient.getMinutes() < 10 ? ("0" + dateObjectClient.getMinutes()) : dateObjectClient.getMinutes();
		var second = dateObjectClient.getSeconds() < 10 ? ("0" + dateObjectClient.getSeconds()) : dateObjectClient.getSeconds();
		var dateObject;
		if (!formatString) dateObject = day.toString() + "." + month.toString() + "." + fullYear.toString();
		else {
			dateObject = formatString
			dateObject = dateObject.replace(/yyyy/g, fullYear);
			dateObject = dateObject.replace(/yy/g, year);
			dateObject = dateObject.replace(/mm/g, minute);
			dateObject = dateObject.replace(/MM/g, month);
			dateObject = dateObject.replace(/ss/g, second);
			dateObject = dateObject.replace(/hh/g, hour);
			dateObject = dateObject.replace(/dd/g, day);
			dateObject = dateObject.replace(/HH/g, hour12);
		}
		return dateObject;
	} else throw "illegal argument, expected long: " + date;
};

function dateParse(date) {
	if (typeof date === "string" && date != "" && date != undefined) {
		var dateObjectServer = new Date(date);
		dateObjectServer = dateObjectServer.getTime() + (dateObjectServer.getTimezoneOffset() * 1000 * 60);
		return dateObjectServer;
	} else throw "illegal argument, expected string: " + date;
}

;(function() {
	function convertToRadioButtonDesign() {
		var $input;
		var $that = $();
		var selector = 'input:radio';
		if (this instanceof Node) $that = $(this);
		else if (this instanceof $) $that = this;
		if ($that.length > 0) {
			if ($that.is(selector)) $input = $that;
			else $input = $that.find(selector);
		} else $input = $(selector);

		$input.hide().each(function() {
			if ($(this).next().hasClass("radio-fx") == false) {
				$(this).attr('data-radio-fx', this.name);
				var label = $("label[for=" + '"' + this.id + '"' + "]").text();
				$('<a ' + (label != '' ? 'title=" ' + label + ' "' : '') + ' data-radio-fx="' + this.name + '" class="radio-fx" href="#">\
					<span class="radio' + (this.checked ? ' radio-checked' : '') + '"></span>\
				</a>').insertAfter(this);
			}
		});

		$(document).off('click.convertToRadioButtonDesign', 'a.radio-fx');
		$(document).on('click.convertToRadioButtonDesign', 'a.radio-fx', function(e) {
			e.preventDefault();
			var unique = $(this).attr('data-radio-fx');
			$("a[data-radio-fx='" + unique + "'] span").attr('class', 'radio');
			$('[type="radio"][data-radio-fx="' + unique + '"]').attr('checked', false);
			$(this).find('span').addClass('radio-checked');
			$(this).prev('input[type="radio"]').attr('checked', true).trigger('change');
		});
		$(document).off('keydown.convertToRadioButtonDesign', 'a.radio-fx');
		$(document).on('keydown.convertToRadioButtonDesign', 'a.radio-fx', function(e) {
			if ((e.keyCode ? e.keyCode : e.which) == 32) $(this).trigger('click');
		});
	}
	$(document).ready(convertToRadioButtonDesign);
	$.fn.reloadWidget.addSuccessCallback(convertToRadioButtonDesign);
})();

if (typeof getScrollOffset != 'function') getScrollOffset = function() {
	return 0;
};

if (Element.prototype.scrollIntoView) {
	Element.prototype.orgScrollIntoView = Element.prototype.scrollIntoView;
	Element.prototype.scrollIntoView = function() {
		Element.prototype.orgScrollIntoView.apply(this, arguments);
		if (!arguments.length > 0 || (typeof arguments[0] == 'boolean' && arguments[0]) || (typeof arguments[0] == 'object' && arguments[0].block == 'start')) {
			window.scrollTo(window.scrollX || window.pageXOffset || document.body.scrollLeft, (window.scrollY || window.pageYOffset || document.body.scrollTop) - getScrollOffset());
		}
	};
}

$(document).off("tooltipopen.touchEvents");
$(document).on("tooltipopen.touchEvents", function(event, ui) {
	setTimeout(function() {
		$(document).off('touchstart.tooltip');
		$(document).on('touchstart.tooltip', function() {
			$(document).off('touchstart.tooltip');
			try {
				$(event.target).tooltip("close");
			} catch (e) {}
		});
	});
});
$(document).off("tooltipclose.touchEvents");
$(document).on("tooltipclose.touchEvents", function(event, ui) {
	setTimeout(function() {
		$(event.target).off('touchstart.tooltip');
		$(event.target).on('touchstart.tooltip', function() {
			$(event.target).off('touchstart.tooltip');
			$(event.target).tooltip("open");
		});
	});
});

(function() {
	var scrollToInvalid = function() {
		$('input,select,textarea').off('invalid.scrollToInvalid');
		$('input,select,textarea').on('invalid.scrollToInvalid', function() {
			$(':invalid:visible').last().scrollIntoView();
		});
	};
	scrollToInvalid();
	$.fn.reloadWidget.addSuccessCallback(scrollToInvalid);
})();

var getResponseErrorCodes = function(response){
	var message = '';
	if(response) {
		if(response.responseJSON) response = response.responseJSON;
		if(response.namespace && response.errorcode) message = message + '<br/>' + response.namespace + '::' + response.errorcode;
		if(response.id) message = message + '<br/>id: ' + response.id;
	}
	return message;
};

var executeLazyLoad = function(){
	$('a').each(function(){
	    if(typeof $(this).attr('href') != 'undefined' && $(this).attr('target') == "_blank" && !$(this).attr('rel')) {
	        var isExternal = function(url) {
	            var domain = function(url) {
	                return url.replace('http://','').replace('https://','').split('/')[0];
	            };
	            return (domain(location.href) !== domain(url) && domain(url) != '');
	        };
	        if(isExternal($(this).attr('href'))) {
	        	$(this).attr('rel', 'noopener')
        	}
	    }
	});
	
	var lazyImages = [].slice.call(document.querySelectorAll(".lazy"));
	if ("IntersectionObserver" in window) {
		var lazyImageObserver = new IntersectionObserver(function(entries, observer) {
	    	entries.forEach(function(entry) {
		        if (entry.isIntersecting) {
		        	var lazyImage = entry.target;
		        	if($(entry.target).hasClass('backgroundImage')) {
		        		$(entry.target).css('background-image', "url(" + $(entry.target).data('src') + ")");
		        	} else {
		        		$(entry.target).attr('src', $(entry.target).data('src') ? $(entry.target).data('src') : $(entry.target).attr('src'));  
		        	}
		        	$(entry.target).removeClass("lazy");
		        	lazyImageObserver.unobserve(lazyImage);
		        }
			});
		});
		lazyImages.forEach(function(lazyImage) {
		    lazyImageObserver.observe(lazyImage);
		});
	} else {
		$(".lazy").each(function() {
        	var $this = $(this);
        	if($this.hasClass('backgroundImage')) {
        		$this.css('background-image', "url(" + $this.data('src') + ")");
        	} else {
        		$this.attr('src', $this.data('src') ? $this.data('src') : $this.attr('src'));
        	}
        	$this.removeClass("lazy");
        });
	}
}
$(document).ready(function(){
	executeLazyLoad();
	var targetNode = document.body;
	var observerConfig = {childList: true};
	var mutationObserverCallback = function(mutationsList, observer) {
		if(typeof executeLazyLoadcms == 'function') {
			executeLazyLoadcms();
		};
	};
	var mutationObserver = new MutationObserver(mutationObserverCallback);
	mutationObserver.observe(targetNode, observerConfig);
});
$.fn.reloadWidget.addSuccessCallback(executeLazyLoad);
(function() {
	var lazyLoadCSS = function(type, rel, as, hrefArr){
		for(var i = 0; i < hrefArr.length; i++){
			var link = document.createElement('link');
			if(!as) link.type = type ? type : 'text/css';
			link.rel = rel ? rel : 'stylesheet';
			if(as) link.as = as; 
			link.href = hrefArr[i];
			var s = document.getElementsByTagName('link')[0];
			s.parentNode.insertBefore(link, s);
		}
	};
	lazyLoadCSS(false,false,false,[
		"//cdn.expert.de/static/resources/private/vendors/css/font-awesome/font-awesome.min.css",
		"//cdn.expert.de/static/resources/private/vendors/css/jquery.blueimp/jquery.blueimp.min.css",
		"//cdn.expert.de/static/resources/private/vendors/css/jquery.slick/jquery.slick.min.css",
		"//cdn.expert.de/static/resources/private/vendors/css/jquery.select2/jquery.select2.min.css",
		"//cdn.expert.de/static/resources/private/vendors/css/jquery.ui/jquery-ui.css",
		"//cdn.expert.de/static/resources/private/vendors/css/jquery.ui.timepicker/jquery.ui.timepicker.min.css",
		"//cdn.expert.de/static/resources/private/vendors/css/alertify/alertify.min.css",
		"//cdn.expert.de/static/resources/private/vendors/css/alertify/alertify.theme.min.css"
	]);
})();