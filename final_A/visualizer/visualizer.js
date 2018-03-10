"use strict";
var visualizer;
(function (visualizer) {
    var inf = 1000000000;
    /**
     * lineno は ユーザにエラーメッセージを表示するとき用。1-indexed で渡すこと
     */
    var getInt = function (s, lineno) {
        if (s == null) {
            throw new Error("\u6570\u5024\u306E\u30D1\u30FC\u30B9\u306B\u5931\u6557\u3057\u307E\u3057\u305F at line: " + lineno);
        }
        if (s.match(/^-?\d+$/)) {
            return parseInt(s);
        }
        console.log(s);
        throw new Error("\u6570\u5024\u306E\u30D1\u30FC\u30B9\u306B\u5931\u6557\u3057\u307E\u3057\u305F at line: " + lineno);
    };
    // 距離による色
    var distColors = (function () {
        var maxDist = 360;
        var ret = new Array(maxDist);
        for (var d = 0; d < maxDist; d++) {
            ret[d] = "hsl(" + d + ",100%,70%)";
        }
        return ret;
    })();
    var Queue = /** @class */ (function () {
        function Queue() {
            this.array = [];
            this.head = 0;
        }
        Queue.prototype.push_back = function (e) {
            this.array.push(e);
        };
        Queue.prototype.pop_front = function () {
            return this.array[this.head++];
        };
        Queue.prototype.length = function () {
            return this.array.length - this.head;
        };
        return Queue;
    }());
    var TestCase = /** @class */ (function () {
        function TestCase(problem_input) {
            var _this = this;
            var lines = problem_input.trim().split("\n");
            var firstLine = lines.shift();
            if (firstLine == undefined)
                throw new Error("WA: \u5165\u529B\u30D5\u30A1\u30A4\u30EB\u304C\u7A7A\u3067\u3059");
            var n_k = firstLine.trim().split(" ");
            if (n_k.length != 2)
                throw new Error("WA: \u5165\u529B\u30D5\u30A1\u30A4\u30EB\u306E1\u884C\u76EE\u306F\u5024\u304C2\u3064\u3067\u306A\u304F\u3066\u306F\u3044\u3051\u307E\u305B\u3093");
            _a = n_k.map(function (v) { return getInt(v, 1); }), this.n = _a[0], this.k = _a[1];
            if (lines.length != this.k)
                throw new Error("WA: \u5165\u529B\u30D5\u30A1\u30A4\u30EB\u306E\u884C\u6570\u304C\u7570\u5E38\u3067\u3059");
            this.A = new Array(this.k);
            this.B = new Array(this.k);
            this.C = new Array(this.k);
            this.D = new Array(this.k);
            lines.forEach(function (line, i) {
                var vars = line.trim().split(" ");
                if (vars.length != 4)
                    throw new Error("WA: \u5165\u529B\u30D5\u30A1\u30A4\u30EB\u306E" + (i + 2) + "\u884C\u76EE\u306F\u5024\u304C4\u3064\u3067\u306A\u304F\u3066\u306F\u3044\u3051\u307E\u305B\u3093");
                var cords = vars.map(function (v) { return getInt(v, i + 2); });
                if (cords.filter(function (v) { return v < 0 || v >= _this.n; }).length > 0)
                    throw new Error("WA: \u5165\u529B\u30D5\u30A1\u30A4\u30EB\u306E" + (i + 2) + "\u884C\u76EE\u306E\u5024\u304C\u7570\u5E38\u3067\u3059");
                _this.A[i] = cords[0], _this.B[i] = cords[1], _this.C[i] = cords[2], _this.D[i] = cords[3];
                console.log(_this.A[i], _this.B[i], _this.C[i], _this.D[i]);
            });
            var _a;
        }
        TestCase.prototype.initialFrame = function () {
            var frame = new Frame();
            frame.testCase = this;
            frame.turn = -1;
            frame.score = 0;
            frame.totalScore = 0;
            frame.r = -1;
            frame.c = -1;
            frame.D = Array(this.n * this.n);
            for (var i = 0; i < this.D.length; i++)
                frame.D[i] = 0;
            return frame;
        };
        TestCase.prototype.calcFrames = function (contestant_output) {
            var _this = this;
            var frames = [];
            var cur = this.initialFrame();
            var lines = contestant_output.trim().split("\n");
            if (lines.length != this.k)
                throw new Error("WA: \u64CD\u4F5C\u56DE\u6570\u306F" + this.k + "\u56DE\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059");
            lines.forEach(function (line, i) {
                if (line.length == 0)
                    return;
                var vars = line.trim().split(" ");
                if (vars.length != 2)
                    throw new Error("WA: \u51FA\u529B\u30D5\u30A1\u30A4\u30EB\u306E" + i + "\u884C\u76EE\u306F\u5024\u304C2\u3064\u3067\u306A\u304F\u3066\u306F\u3044\u3051\u307E\u305B\u3093");
                var cords = vars.map(function (v) { return getInt(v, i); });
                if (cords.filter(function (v) { return v < -1 || v >= _this.n; }).length > 0)
                    throw new Error("WA: \u51FA\u529B\u30D5\u30A1\u30A4\u30EB\u306E" + i + "\u884C\u76EE\u306E\u5024\u304C\u7570\u5E38\u3067\u3059");
                var r = cords[0], c = cords[1];
                if (+(r == -1) ^ +(c == -1))
                    throw new Error("WA: \u51FA\u529B\u30D5\u30A1\u30A4\u30EB\u306E" + i + "\u884C\u76EE\u306E\u5024\u304C\u7570\u5E38\u3067\u3059"); // 片方-1なら両方-1じゃないとダメ
                cur = cur.calcNextFrame(r, c);
                frames.push(cur);
            });
            return frames;
        };
        return TestCase;
    }());
    var Frame = /** @class */ (function () {
        function Frame() {
        }
        Frame.prototype.calcNextFrame = function (r, c) {
            var next = new Frame();
            next.testCase = this.testCase;
            next.turn = this.turn + 1;
            next.r = r;
            next.c = c;
            var n = next.testCase.n;
            var D = next.D = Array(n * n);
            {
                var idx = 0;
                for (var r_1 = 0; r_1 < n; r_1++) {
                    for (var c_1 = 0; c_1 < n; c_1++) {
                        if (this.D[r_1 * n + c_1] == -1) {
                            D[idx++] = -1;
                        }
                        else {
                            D[idx++] = inf;
                        }
                    }
                }
            }
            // r, c を toggle
            if (D[r * n + c] == -1) {
                D[r * n + c] = inf;
            }
            else {
                D[r * n + c] = -1;
            }
            var sr = next.testCase.A[next.turn];
            var sc = next.testCase.B[next.turn];
            var gr = next.testCase.C[next.turn];
            var gc = next.testCase.D[next.turn];
            // 始点も終点も壁じゃないので、bfs
            if (D[sr * n + sc] != -1 && D[gr * n + gc] != -1) {
                var dr = [-1, +1, 0, 0];
                var dc = [0, 0, -1, +1];
                var rq = new Queue();
                var cq = new Queue();
                D[sr * n + sc] = 0;
                rq.push_back(sr);
                cq.push_back(sc);
                while (rq.length()) {
                    var cr = rq.pop_front();
                    var cc = cq.pop_front();
                    if (cr == gr && cc == gc)
                        break; // goal
                    for (var dir = 0; dir < 4; dir++) {
                        var nr = cr + dr[dir];
                        var nc = cc + dc[dir];
                        if (nr < 0 || nc < 0 || nr >= n || nc >= n)
                            continue; // 外
                        var nex = nr * n + nc;
                        if (D[nex] == -1)
                            continue; // 壁
                        if (D[nex] > D[cr * n + cc] + 1) {
                            D[nex] = D[cr * n + cc] + 1;
                            rq.push_back(nr);
                            cq.push_back(nc);
                        }
                    }
                }
                // 経路復元
                var used = new Array(n * n);
                if (D[gr * n + gc] < inf) {
                    // ゴールにたどり着けている
                    var r_2 = gr;
                    var c_2 = gc;
                    used[r_2 * n + c_2] = 1;
                    while (r_2 != sr || c_2 != sc) {
                        var cur = r_2 * n + c_2;
                        for (var dir = 0; dir < 4; dir++) {
                            var nr = r_2 + dr[dir];
                            var nc = c_2 + dc[dir];
                            if (nr < 0 || nc < 0 || nr >= n || nc >= n)
                                continue; // 外
                            var nex = nr * n + nc;
                            if (D[nex] == D[cur] - 1) {
                                r_2 = nr;
                                c_2 = nc;
                                used[r_2 * n + c_2] = 1;
                                break;
                            }
                        }
                    }
                }
                // 最短路以外を inf で埋め戻し
                for (var r_3 = 0; r_3 < n; r_3++) {
                    for (var c_3 = 0; c_3 < n; c_3++) {
                        if (D[r_3 * n + c_3] != -1) {
                            if (used[r_3 * n + c_3] != 1)
                                D[r_3 * n + c_3] = inf;
                        }
                    }
                }
            }
            // score
            next.score = 0;
            next.dist = -1;
            if (D[gr * n + gc] > 0 && D[gr * n + gc] < inf) {
                // ゴールにたどり着けている
                next.dist = D[gr * n + gc];
                next.score = next.dist * next.dist;
            }
            next.totalScore = next.score + this.totalScore;
            return next;
        };
        return Frame;
    }());
    visualizer.init = function () {
        var file1 = document.getElementById("file1");
        var file2 = document.getElementById("file2");
        var scoreInput = document.getElementById("score");
        var distInput = document.getElementById("dist");
        var dist2Input = document.getElementById("dist2");
        // controls
        var seek = document.getElementById("seek");
        var pos = document.getElementById("pos");
        var firstButton = document.getElementById("firstButton");
        var prevButton = document.getElementById("prevButton");
        var playButton = document.getElementById("playButton");
        var nextButton = document.getElementById("nextButton");
        var lastButton = document.getElementById("lastButton");
        var maxfps = document.getElementById("maxfps");
        var exportButton = document.getElementById("exportButton");
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext('2d');
        if (ctx == null) {
            return function () {
                alert('未対応ブラウザです');
            };
        }
        var load_to = function (file, callback) {
            var reader = new FileReader();
            reader.readAsText(file);
            reader.onloadend = function () {
                callback(reader.result);
            };
        };
        var id = null;
        var run = function (value1, value2) {
            scoreInput.value = '0';
            seek.min = seek.max = pos.value = seek.value = '0';
            pos.step = seek.step = '1';
            var testCase;
            try {
                testCase = new TestCase(value1);
            }
            catch (e) {
                alert(e);
                console.warn(e);
                scoreInput.value = 'ERROR at input';
                return;
            }
            var frames;
            try {
                frames = testCase.calcFrames(value2);
            }
            catch (e) {
                alert(e);
                console.warn(e);
                scoreInput.value = 'WA';
                return;
            }
            // 以下、表示のための変数と関数
            var n = testCase.n;
            canvas.width = 800;
            canvas.height = 800;
            var width = canvas.width;
            var height = canvas.height;
            var cell_width = Math.floor(width / n);
            var cell_height = Math.floor(height / n);
            var wallColor = '#7a571e';
            var floorColor = '#fcedd4';
            var floorBorderColor = '#f1e2c9';
            var floorBorderColor2 = '#d1c2a9';
            var startColor = '#00f';
            var goalColor = '#f00';
            var currentFloorColor = '#222';
            var currentWallColor = '#ccc';
            var ctop = function (y) {
                return y * cell_height;
            };
            var clef = function (x) {
                return x * cell_width;
            };
            var draw = function (frame) {
                var drawFloor = function (r, c) {
                    var dist = frame.D[r * n + c];
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = floorBorderColor;
                    if (dist == inf) {
                        // 未到達
                        var y = ctop(r);
                        var x = clef(c);
                        ctx.strokeRect(x, y, cell_width, cell_height);
                    }
                };
                var drawBorders = function () {
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    // 縦線
                    var yt = ctop(0);
                    var yb = ctop(n + 1);
                    for (var c = 5; c < n; c += 5) {
                        var x = clef(c);
                        ctx.moveTo(x, yt);
                        ctx.lineTo(x, yb);
                    }
                    // 横線
                    var xl = clef(0);
                    var xr = clef(n + 1);
                    for (var r = 5; r < n; r += 5) {
                        var y = ctop(r);
                        ctx.moveTo(xl, y);
                        ctx.lineTo(xr, y);
                    }
                    ctx.strokeStyle = floorBorderColor2;
                    ctx.stroke();
                };
                var drawCell = function (r, c) {
                    var dist = frame.D[r * n + c];
                    if (dist == inf)
                        return;
                    else if (dist == -1) {
                        // 壁
                        ctx.fillStyle = wallColor;
                    }
                    else if (dist < inf) {
                        // 到達可能
                        ctx.fillStyle = distColors[dist % distColors.length];
                    }
                    var y = ctop(r);
                    var x = clef(c);
                    ctx.fillRect(x, y, cell_width, cell_height);
                };
                ctx.fillStyle = floorColor;
                ctx.fillRect(0, 0, width, height);
                // 床描画
                for (var r = 0; r < n; r++) {
                    for (var c = 0; c < n; c++) {
                        drawFloor(r, c);
                    }
                }
                // 枠線描画
                drawBorders();
                // 描画
                for (var r = 0; r < n; r++) {
                    for (var c = 0; c < n; c++) {
                        drawCell(r, c);
                    }
                }
                if (frame.dist > 0) {
                    // 到達可能
                    ctx.shadowBlur = cell_width;
                    // 始点
                    {
                        var r = testCase.A[frame.turn];
                        var c = testCase.B[frame.turn];
                        ctx.fillStyle = ctx.shadowColor = distColors[0];
                        var y = ctop(r);
                        var x = clef(c);
                        ctx.fillRect(x, y, cell_width, cell_height);
                    }
                    // 終点
                    {
                        var r = testCase.C[frame.turn];
                        var c = testCase.D[frame.turn];
                        ctx.fillStyle = ctx.shadowColor = distColors[frame.dist % 360];
                        var y = ctop(r);
                        var x = clef(c);
                        ctx.fillRect(x, y, cell_width, cell_height);
                    }
                    ctx.shadowBlur = 0;
                }
                else {
                    // 到達不能
                    ctx.shadowBlur = cell_width / 2;
                    // 始点
                    {
                        var r = testCase.A[frame.turn];
                        var c = testCase.B[frame.turn];
                        ctx.strokeStyle = ctx.shadowColor = startColor;
                        var y = ctop(r);
                        var x = clef(c);
                        ctx.strokeRect(x + 2, y + 2, cell_width - 4, cell_height - 4);
                    }
                    // 終点
                    {
                        var r = testCase.C[frame.turn];
                        var c = testCase.D[frame.turn];
                        ctx.strokeStyle = ctx.shadowColor = goalColor;
                        var y = ctop(r);
                        var x = clef(c);
                        ctx.strokeRect(x + 2, y + 2, cell_width - 4, cell_height - 4);
                    }
                    ctx.shadowBlur = 0;
                }
                // そのターンの操作
                if (frame.r != -1 && frame.c != -1) {
                    var r = frame.r;
                    var c = frame.c;
                    if (frame.D[r * n + c] == -1) {
                        // 壁にした
                        ctx.strokeStyle = currentWallColor;
                    }
                    else {
                        // 床にした
                        ctx.strokeStyle = currentFloorColor;
                    }
                    ctx.lineWidth = 2;
                    var y = ctop(r);
                    var x = clef(c);
                    ctx.strokeRect(x + 2, y + 2, cell_width - 4, cell_height - 4);
                }
            };
            // 以下、ボタン類のコールバックとか
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // 表示するやつ
            var d = function () {
                var frame = frames[parseInt(seek.value)];
                draw(frame);
                scoreInput.value = Math.ceil(frame.totalScore / 10000.0).toString();
                distInput.value = frame.dist < 0 ? "-" : frame.dist.toString();
                dist2Input.value = frame.score.toString();
            };
            var fps = parseInt(maxfps.value);
            var updateInterval = 1000 / fps;
            // 最終フレームを表示
            pos.value = pos.max = seek.value = seek.max = (frames.length - 1).toString();
            d();
            seek.onchange = seek.oninput = function () {
                pos.value = seek.value;
                d();
            };
            pos.onchange = function () {
                seek.value = pos.value;
                d();
            };
            firstButton.onclick = function () {
                seek.value = pos.value = seek.min;
                d();
            };
            var gotoPrevFrame = prevButton.onclick = function () {
                var f = parseInt(seek.value);
                if (f > 0) {
                    f--;
                    pos.value = seek.value = f.toString();
                    d();
                }
            };
            var gotoNextFrame = nextButton.onclick = function () {
                var f = parseInt(seek.value);
                if (f < frames.length - 1) {
                    f++;
                    pos.value = seek.value = f.toString();
                    d();
                }
            };
            lastButton.onclick = function () {
                pos.value = seek.value = seek.max;
                d();
            };
            // 矢印キー左右で移動
            window.onkeydown = function (e) {
                if (e.target == seek)
                    return;
                switch (e.keyCode) {
                    case 37:
                        gotoPrevFrame();
                        break;
                    case 39:
                        gotoNextFrame();
                        break;
                }
            };
            var play = function () {
                if (seek.value == seek.max) {
                    seek.value = '0';
                }
                var stop = function () {
                    if (id != null) {
                        clearInterval(id);
                        playButton.onclick = play;
                        id = null;
                    }
                };
                id = setInterval(function () {
                    var f = parseInt(seek.value);
                    if (f < frames.length - 1) {
                        f++;
                        pos.value = seek.value = f.toString();
                        d();
                    }
                    else {
                        stop();
                    }
                }, updateInterval);
                playButton.onclick = stop;
            };
            maxfps.onchange = function () {
                var v = parseInt(maxfps.value);
                updateInterval = 1000 / v;
                console.log(updateInterval);
                if (id != null) {
                    clearInterval(id);
                    play();
                }
            };
            exportButton.onclick = function () {
                var dataURL = canvas.toDataURL('image/png');
                var anchor = document.createElement('a');
                anchor.href = dataURL;
                anchor.download = 'visualizer.png';
                var e = document.createEvent('MouseEvent');
                e.initEvent("click", true, true);
                anchor.dispatchEvent(e);
                // anchor.dispatchEvent(new CustomEvent('click'));
            };
            playButton.onclick = play;
            playButton.focus();
        };
        return function () {
            if (id != null)
                clearInterval(id);
            id = null;
            file1.files && load_to(file1.files[0], function (value1) {
                file2.files && load_to(file2.files[0], function (value2) {
                    run(value1.trim(), value2.trim());
                });
            });
        };
    };
})(visualizer || (visualizer = {}));
window.onload = function () {
    document.getElementById("run").onclick = visualizer.init();
};
//# sourceMappingURL=visualizer.js.map