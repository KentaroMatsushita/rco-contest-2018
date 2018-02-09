// ==UserScript==
// @name         AtCoder Standings for RCO Contest 2018
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Provide standings for Nihonbashi Half Marathon
// @author       Recruit Communications Co., Ltd.
// @license      MIT License
// @include      *://rco-contest-2018-*.contest.atcoder.jp/standings*
// @include      *://beta.atcoder.jp/contests/rco-contest-2018-*/standings*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 各問題の順位からスコアを計算して表示
    var rcoMode = function() {
        // 元の順位表をクリア
        $('tbody tr').remove();
        $('div#pagination-standings').remove();

        var data = ATCODER.standings.data;
        var sorted = new Array(data[0].tasks.length);
        for(var i = 0; i < sorted.length; i++) {
            sorted[i] = data.map((d) => d.tasks[i].score || 0).sort((a, b) => b - a);
            data.forEach((d) => d.tasks[i].rank = sorted[i].indexOf(d.tasks[i].score || 0) + 1);
        }
        data.forEach(function(d) {
            d.score = d.tasks.map((e) => e.rank).reduce((a, b) => a * b, 1);
            d.sub_score = Math.min.apply(null, d.tasks.map((e) => e.rank));
        });
        var sorted_overall_score = data.map((d) => [d.score, d.sub_score])
            .sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((d) => d.join());
        data.forEach((d) => d.rank = sorted_overall_score.indexOf([d.score, d.sub_score].join()) + 1);

        // 順位・総合得点順のときだけソート
        var query = location.search.replace('order_by=total', '').replace('?', '').replace('&', '');
        if (query === '') {
            data.sort((a, b) => a.rank - b.rank);
        } else if (query === 'rev=true') {
            data.sort((a, b) => b.rank - a.rank);
        }

        data.forEach(addLine);

        // 自分のところまでスクロール
        if ($('tr.standings-me').offset()) {
          $("html, body").animate({ scrollTop: $('tr.standings-me').offset().top - 200 }, 200);
        }
        $('.tooltip-label').tooltip({placement:'top'});
    };

    var scoreTime = function(d){
        if (d.score) {
            return d.score/100 + ' / ' + Math.floor(d.elapsed_time/60) + ':' + ('0'+d.elapsed_time%60).slice(-2);
        } else {
            return '-';
        }
    };

    // 順位表に行を追加
    var addLine = function(d){
        var name = d.user_screen_name;
        var line = '<td class="standings-rank">'+d.rank+'</td><td class="standings-username">';
        line += '<img src="/img/flag/'+d.country+'.png" style="vertical-align: middle;"> ';
        line += '<a class="username '+ getRatingClass(d.competitions, d.rating) +'" href="https://atcoder.jp/user/' + encodeURIComponent(name) + '">'+name+'</a>';
        line += '<a href="/submissions/all?user_screen_name=' + encodeURIComponent(name) + '">';
        line += ' <i class="icon-search tooltip-label" rel="tooltip" data-title="View ' + escapeAttrValue(name) + '\'s submissions' + '" data-original-title=""></i>';
        line += '</a></td>';
        line += d.tasks.map((t) => '<td class="center"><p><span class="standings-ac">'+ t.rank +'</span><br>'+ scoreTime(t) +'</p></td>').join('');
        line += '<td class="center"><p><span class="standings-score">'+d.score+'</span></p></td>';
        var myid = $.cookie('_user_id');
        if (myid == d.user_id) {
            $('tbody').append('<tr class="standings-me">'+line+'</tr>');
        } else {
            $('tbody').append('<tr>'+line+'</tr>');
        }
    };

    var escapeAttrValue = function(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    var getRatingClass = function(competitions, rating){
      if(typeof competitions === "undefined" || typeof rating === "undefined") { return ""; }
      if(competitions === 0) { return "user-unrated"; }
      var rating_table = [
          {"rating":  400, "name": "user-gray"},
          {"rating":  800, "name": "user-brown"},
          {"rating": 1200, "name": "user-green"},
          {"rating": 1600, "name": "user-cyan"},
          {"rating": 2000, "name": "user-blue"},
          {"rating": 2400, "name": "user-yellow"},
          {"rating": 2800, "name": "user-orange"}
      ];
      for(var i = 0 ; i < rating_table.length ; i++) {
          if(rating < rating_table[i].rating) { return rating_table[i].name; }
      }
      return "user-red";
    };


    var setRCOMode = function(){
        if (typeof $.cookie !== 'undefined') {
            $.cookie("rcocon-mode", null);
        }
    };

    var unsetRCOMode = function(){
        if (typeof $.cookie !== 'undefined') {
            $.cookie("rcocon-mode", '0');
        }
    };

    var isRCOModeEnabled = function(){
        // rcocon-mode=0 がセットされていると通常の順位表になる
        if (typeof $.cookie !== 'undefined') {
            return $.cookie("rcocon-mode") !== '0';
        } else {
            return false;
        }
    };

    var found = location.href.match(/^https?:\/\/beta.atcoder.jp\/contests\/([^\/]+)/i);
    if (found) {
        $('.h2').parent().after('<div class="h5"><a href="https://' + found[1] + '.contest.atcoder.jp/standings" target="_blank">→ RCO日本橋ハーフマラソン用の順位表を開く</div>');
    } else {
        $('h2').after('<input type="checkbox" id="rcocon-mode"> RCO日本橋ハーフマラソンの順位にする');
    }

    $('#rcocon-mode').change(function(){
        if ($('#rcocon-mode').is(':checked')) {
            setRCOMode();
            rcoMode();
        } else {
            // Cookieをセットしてリロード
            unsetRCOMode();
            location.href = "/standings";
        }
    });

    if (isRCOModeEnabled()) {
        $('#rcocon-mode').prop('checked', true);
        rcoMode();
    }
})();