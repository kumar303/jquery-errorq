/*
    Robust error/retry queue for Ajax requests.

    Documentation, pull requests, and bug reporting:
    https://github.com/kumar303/jquery-errorq

    (c) Kumar McMillan
    Apache License -- have fun!
*/

(function( $ ){

"use strict";

$.fn.errorq = function(config) {
    if (typeof this._errorq === 'undefined') {
        this._errorq = new ErrorQ(this);
    }
    if (typeof config !== 'undefined') {
        this._errorq.configure(config);
    }
    return this._errorq;
};

var _id = 0;

function ErrorQ(elem) {
    this.queue = [];
    this.elem = elem;
    this.retryInterval = 2000;
    this.maxRetries = 8;
};

ErrorQ.prototype.ajax = function(settings) {
    var that = this;
    _id ++;
    that.queue.push(new Work(that, _id, settings));
    that._tryQueue();
};

ErrorQ.prototype.abort = function(id) {
    var that = this,
        newQueue = [];
    $.each(that.queue, function(i, w) {
        if (w.id == id) {
            if (w.xhr)
                w.xhr.abort();
            w.aborted = true;
            that.elem.trigger('abort.errorq', [w]);
            return true;
        }
        newQueue.push(w);
    });
    that.queue = newQueue;
};

ErrorQ.prototype.abortAll = function() {
    var that = this;
    $.each(that.queue, function(i, w) {
        if (w.xhr)
            w.xhr.abort();
    });
    that.queue = [];
};

ErrorQ.prototype.bind = function(event, handler) {
    event += '.errorq';
    this.elem.bind(event, handler);
};

ErrorQ.prototype.configure = function(config) {
    var that = this;
    for (var k in config) {
        that[k] = config[k];
    }
};

ErrorQ.prototype._tryQueue = function() {
    var that = this,
        newQueue = [],
        timeout = false;
    if (that.queue.length == 0) {
        return;
    }
    $.each(that.queue, function(i, work) {
        if (work.success) {
            return true;
        }
        if (work.xhr) {
            // already waiting for a response
            return true;
        }
        work.tries ++;
        if (work.tries > that.maxRetries) {
            work.abort();
            return true;
        }

        newQueue.push(work);

        var settings = {
            _error: function() {},
            error: function(jqXHR, textStatus, errorThrown) {
                work.xhr = false;
                that.elem.trigger('error.errorq', [work]);
                if (!timeout) {
                    timeout = setTimeout(function() {
                        that._tryQueue();
                    }, that.retryInterval);
                }
                settings._error(jqXHR, textStatus, errorThrown);
            },
            _success: function() {},
            success: function(data, textStatus, jqXHR) {
                work.xhr = false;
                work.success = true;
                that.elem.trigger('success.errorq', [work]);
                settings._success(data, textStatus, jqXHR);
            }
        };

        for (var k in work.ajaxSettings) {
            var prop = work.ajaxSettings[k];
            switch (k) {
                case 'error':
                case 'success':
                    settings['_' + k] = prop;
                    break;
                default:
                    settings[k] = prop;
                    break;
            }
        }
        work.xhr = $.ajax(settings);
    });
    that.queue = newQueue;
};

function Work(errorq, id, ajaxSettings) {
    this.errorq = errorq;
    this.id = id;
    this.ajaxSettings = ajaxSettings;
    this.success = false;
    this.xhr = false;
    this.aborted = false;
    this.tries = 0;
};

Work.prototype.abort = function() {
    this.errorq.abort(this.id);
};

})( jQuery );
