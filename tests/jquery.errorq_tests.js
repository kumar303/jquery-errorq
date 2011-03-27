
$(function(){

"use strict";

module('errorq', {
    setup: function() {
        $.mockjax({
            url: '/good',
            status: 200,
            responseText: 'server ok',
            responseTime: 0
        });
        $.mockjax({
            url: '/bad',
            status: 500,
            responseText: 'server error',
            responseTime: 0
        });
        this.sandbox = tests.createSandbox();
    },
    teardown: function() {
        $.mockjaxClear();
        this.sandbox.errorq().abortAll();
        this.sandbox.remove();
    }
});

asyncTest('test error', function() {
    var handled = false,
        errorq = this.sandbox.errorq();

    errorq.bind('error', function() {
        handled = true;
        errorq.abortAll();
    });

    errorq.ajax({
        url: '/bad',
        success: function(data, textStatus, jqXHR) {}
    });

    tests.waitFor(function() {
        return handled;
    }).thenDo(function() {
        ok(true, 'handled the event');
        start();
    });
});

asyncTest('test error callback', function() {
    var handled = false,
        errorq = this.sandbox.errorq();

    errorq.ajax({
        url: '/bad',
        success: function(data, textStatus, jqXHR) {},
        error: function(jqXHR, textStatus, errorThrown) {
            handled = true;
        }
    });

    tests.waitFor(function() {
        return handled;
    }).thenDo(function() {
        ok(true, 'handled the event');
        start();
    });
});

asyncTest('test retries', function() {
    var done = false,
        errorq = this.sandbox.errorq({retryInterval: 1}),
        count = 0;

    errorq.bind('error', function() {
        count++;
        if (count == 4) {
            done = true;
        }
    });

    errorq.ajax({
        url: '/bad',
        success: function(data, textStatus, jqXHR) {}
    });

    tests.waitFor(function() {
        return done;
    }).thenDo(function() {
        ok(true, 'done');
        start();
    });
});

asyncTest('test max retries', function() {
    var done = false,
        errorq = this.sandbox.errorq({retryInterval: 1, maxRetries: 3}),
        retried = 0;

    errorq.bind('error', function(event, work) {
        retried++;
        if (retried == 6) {
            done = true;
        }
    });

    errorq.bind('abort', function(event, work) {
        done = true;
    });

    errorq.ajax({
        url: '/bad',
        success: function(data, textStatus, jqXHR) {}
    });

    tests.waitFor(function() {
        return done;
    }).thenDo(function() {
        equals(retried, 3);
        start();
    });
});

asyncTest('test receive work', function() {
    var handled = false,
        errorq = this.sandbox.errorq(),
        errorWork = false;

    errorq.bind('error', function(event, work) {
        handled = true;
        errorWork = work;
        errorq.abortAll();
    });

    errorq.ajax({
        url: '/bad',
        success: function(data, textStatus, jqXHR) {}
    });

    tests.waitFor(function() {
        return handled;
    }).thenDo(function() {
        equals(errorWork.ajaxSettings.url, '/bad');
        start();
    });
});

asyncTest('test success', function() {
    var done = false,
        errorq = this.sandbox.errorq({retryInterval: 1}),
        success = false;

    errorq.bind('error', function() {
        done = true;
    });

    errorq.ajax({
        url: '/good',
        success: function(data, textStatus, jqXHR) {
            success = true;
        }
    });

    errorq.ajax({
        url: '/bad'
    });

    tests.waitFor(function() {
        return done;
    }).thenDo(function() {
        equals(errorq.queue.length, 1);
        start();
    });
});

asyncTest('test success event', function() {
    var done = false,
        errorq = this.sandbox.errorq(),
        successWork = false;

    errorq.bind('success', function(event, work) {
        done = true;
        successWork = work;
    });

    errorq.ajax({
        url: '/good',
        success: function(data, textStatus, jqXHR) {}
    });

    tests.waitFor(function() {
        return done;
    }).thenDo(function() {
        equals(successWork.ajaxSettings.url, '/good');
        start();
    });
});

asyncTest('test abort', function() {
    var done = false,
        errorq = this.sandbox.errorq(),
        retriedOnce = false;

    errorq.bind('error', function(event, work) {
        work.abort();
        done = true;
    });

    errorq.ajax({
        url: '/bad',
        success: function(data, textStatus, jqXHR) {}
    });

    tests.waitFor(function() {
        return errorq.queue.length == 0;
    }).thenDo(function() {
        ok(done, 'finished');
        start();
    });
});

asyncTest('test abort event', function() {
    var done = false,
        errorq = this.sandbox.errorq(),
        abortedWork = false;

    errorq.bind('abort', function(event, work) {
        done = true;
        abortedWork = work;
    });

    errorq.bind('error', function(event, work) {
        work.abort();
    });

    errorq.ajax({
        url: '/bad',
        success: function(data, textStatus, jqXHR) {}
    });

    tests.waitFor(function() {
        return done;
    }).thenDo(function() {
        equals(abortedWork.aborted, true);
        start();
    });
});

});
