=======================
errorq, a jQuery plugin
=======================

Robust error/retry queue for Ajax requests.

The Internet is super flaky, especially "cloud services" like Google App
Engine.  This plugin turns any DOM element into a FIFO queue of Ajax
requests that get retried when they fail. A non-successful response is any
that triggers the error handler in a call to ``$.ajax()``.

This is a low-level library that should provide the hooks you need to display
visual information for what's happening as Ajax requests are queued up and
retried in the background. No CSS is required to use the plugin.

.. contents::

Usage
=====

Get a singleton ErrorQ instance for your DOM node like this::

  var errorq = $('#error-viewer').errorq();

Send a request::

  errorq.ajax({
      url: '/myserver',
      type: 'POST',
      data: {foo: 'bar'},
      success: function(data, textStatus, jqXHR) {
          // do your success stuff
      },
      error: function(jqXHR, textStatus, errorThrown) {
          // If you define your *own* error handler
          // then it will be called. If you're using errorq you probably
          // don't need one.
      }
  });

If the request fails then it gets retried after **retryInterval**. You can
keep queuing up requests and the failing ones will get retried in the order
they were received.

The errorq instance is a singleton per DOM node but you can reconfigure it
permanently like this::

  var errorq = $('#error-viewer').errorq({property: 'value'});

Properties:

**ErrorQ.retryInterval**
  Number of milleseconds to wait before retrying, defaults to 2000.

**ErrorQ.maxRetries**
  Number of retries before giving up on a request, defaults to 8.

Events
======

To show visual feedback of what's going you'll probably want to bind functions
to custom ErrorQ events. All events are namespaced but as a shortcut you can
bind like this::

  errorq.bind('<name>', function(event, work) {
      // handle event...
  });

Work
~~~~

When handling events you get access to a simple Work object that contains
information about the work queued up.

Methods:

**work.abort()**
  Tell the request to abort (if in progress) and remove it from the retry queue.

Properties:

**work.id**
  Numeric ID unique to the page. Suitable for creating DOM ids if you
  use a prefix.

**work.ajaxSettings**
  Object containing the settings you passed to ``errorq.ajax({})``

**work.success**
  true if this request was successful.

**work.aborted**
  true if this request was aborted either by the user or by hitting the max
  number of retries

**work.tries**
  Number of tries so far.

**work.errorq**
  ErrorQ instance that created this Work object.

error
~~~~~

This event is fired for each error per Ajax request. When a request gets
retried and fails, the error event is fired again.

::

    errorq.bind('error', function(event, work) {
        // handle event...
    });

success
~~~~~~~

This event is fired when an Ajax request finishes successfully.

::

    errorq.bind('success', function(event, work) {
        // handle event...
    });

abort
~~~~~

This event is fired when an Ajax request is aborted either via
``work.abort()`` or by maxing out the number of retries.

::

    errorq.bind('abort', function(event, work) {
        // handle event...
    });

Developers
==========

To run the tests open ``tests/index.html`` in your favorite web browser.
The test suite is powered by QUnit_

.. _QUnit: http://docs.jquery.com/Qunit
