/*
jQuery Plugin: Query YQL - version 0.4.2 (modified)
https://github.com/hail2u/jquery.query-yql
LICENSE: http://hail2u.mit-license.org/2009
*/

(function ($) {
  "use strict";

  $.queryYQL = function (statement, type, envUrl, callback) {
    if ($.isFunction(type)) {
      callback = type;
      type     = "json";
    } else if (!type.match(/(json|xml)/)) {
      callback = envUrl;
      envUrl   = type;
      type     = "json";
    } else if ($.isFunction(envUrl)) {
      callback = envUrl;
      envUrl   = undefined;
    }

    var url = "https://query.yahooapis.com/v1/public/yql?callback=?",
    data = {
      format: type,
      q:      statement
    };

    if (envUrl === "all") {
      envUrl = "https://www.datatables.org/alltables.env";
    }

    if (envUrl) {
      data.env = envUrl;
    }

    return $.get(url, data, callback, "json");
  };
}(jQuery));
