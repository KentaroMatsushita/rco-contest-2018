module visualizer {
    const inf = 1000000000;

    /**
     * lineno は ユーザにエラーメッセージを表示するとき用。1-indexed で渡すこと
     */
    const getInt = (s: string, lineno: number) => {
        if (s == null) {
            throw new Error(`数値のパースに失敗しました at line: ${lineno}`);
        }
        if (s.match(/^-?\d+$/)) {
            return parseInt(s);
        }
        console.log(s);
        throw new Error(`数値のパースに失敗しました at line: ${lineno}`);
    };

    // 距離による色
    const distColors = (() => {
        const maxDist: number = 360;
        const ret = new Array(maxDist);
        for (let d = 0; d < maxDist; d++) {
            ret[d] = `hsl(${d},100%,70%)`;
        }
        return ret;
    })();

    class Queue<T> {
        private array: T[] = [];
        private head = 0;

        public push_back(e: T) {
            this.array.push(e);
        }

        public pop_front() {
            return this.array[this.head++];
        }

        public length() {
            return this.array.length - this.head;
        }
    }

    class TestCase {
        public n: number;
        public k: number;
        public A: number[];
        public B: number[];
        public C: number[];
        public D: number[];

        constructor(problem_input: string) {
            const lines = problem_input.trim().split("\n");
            const firstLine = lines.shift();
            if (firstLine == undefined) throw new Error(`WA: 入力ファイルが空です`);
            const n_k = firstLine.trim().split(" ");
            if (n_k.length != 2) throw new Error(`WA: 入力ファイルの1行目は値が2つでなくてはいけません`);
            [this.n, this.k] = n_k.map(v => getInt(v, 1));

            if (lines.length != this.k) throw new Error(`WA: 入力ファイルの行数が異常です`);

            this.A = new Array(this.k);
            this.B = new Array(this.k);
            this.C = new Array(this.k);
            this.D = new Array(this.k);

            lines.forEach((line, i) => {
                const vars = line.trim().split(" ");
                if (vars.length != 4) throw new Error(`WA: 入力ファイルの${i + 2}行目は値が4つでなくてはいけません`);
                const cords = vars.map(v => getInt(v, i + 2));
                if (cords.filter(v => v < 0 || v >= this.n).length > 0) throw new Error(`WA: 入力ファイルの${i + 2}行目の値が異常です`);
                [this.A[i], this.B[i], this.C[i], this.D[i]] = cords;
                console.log(this.A[i], this.B[i], this.C[i], this.D[i]);
            });
        }

        private initialFrame(): Frame {
            const frame: Frame = new Frame();
            frame.testCase = this;
            frame.turn = -1;
            frame.score = 0;
            frame.totalScore = 0;
            frame.r = -1;
            frame.c = -1;
            frame.D = Array(this.n * this.n);
            for (let i = 0; i < this.D.length; i++) frame.D[i] = 0;
            return frame;
        }

        public calcFrames(contestant_output: string): Frame[] {
            const frames: Frame[] = [];

            let cur = this.initialFrame();

            const lines = contestant_output.trim().split("\n");
            if (lines.length != this.k) throw new Error(`WA: 操作回数は${this.k}回である必要があります`);

            lines.forEach((line, i) => {
                if (line.length == 0) return;
                const vars = line.trim().split(" ");
                if (vars.length != 2) throw new Error(`WA: 出力ファイルの${i}行目は値が2つでなくてはいけません`);
                const cords = vars.map(v => getInt(v, i));
                if (cords.filter(v => v < -1 || v >= this.n).length > 0) throw new Error(`WA: 出力ファイルの${i}行目の値が異常です`);
                const [r, c] = cords;
                if (+(r == -1) ^ +(c == -1)) throw new Error(`WA: 出力ファイルの${i}行目の値が異常です`);  // 片方-1なら両方-1じゃないとダメ

                cur = cur.calcNextFrame(r, c);
                frames.push(cur);
            });
            return frames;
        }
    }

    class Frame {
        public testCase: TestCase;
        public turn: number;
        public dist: number;
        public score: number;
        public totalScore: number;
        public r: number;  // そのターンの操作 r
        public c: number;  // そのターンの操作 c
        public D: number[];  // (r, c) の、start からの距離。-1 は壁。inf は到達不能。

        public calcNextFrame(r: number, c: number): Frame {
            const next = new Frame();
            next.testCase = this.testCase;
            next.turn = this.turn + 1;
            next.r = r;
            next.c = c;
            const n = next.testCase.n;
            const D = next.D = Array(n * n);

            {
                let idx = 0;
                for (let r = 0; r < n; r++) {
                    for (let c = 0; c < n; c++) {
                        if (this.D[r * n + c] == -1) {
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

            const sr = next.testCase.A[next.turn];
            const sc = next.testCase.B[next.turn];
            const gr = next.testCase.C[next.turn];
            const gc = next.testCase.D[next.turn];

            // 始点も終点も壁じゃないので、bfs
            if (D[sr * n + sc] != -1 && D[gr * n + gc] != -1) {
                const dr = [-1, +1, 0, 0];
                const dc = [0, 0, -1, +1];
                const rq = new Queue<number>();
                const cq = new Queue<number>();
                D[sr * n + sc] = 0;
                rq.push_back(sr);
                cq.push_back(sc);

                while (rq.length()) {
                    const cr = rq.pop_front();
                    const cc = cq.pop_front();
                    if (cr == gr && cc == gc) break;  // goal
                    for (let dir = 0; dir < 4; dir++) {
                        const nr = cr + dr[dir];
                        const nc = cc + dc[dir];
                        if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;  // 外
                        const nex = nr * n + nc;
                        if (D[nex] == -1) continue;  // 壁
                        if (D[nex] > D[cr * n + cc] + 1) {
                            D[nex] = D[cr * n + cc] + 1;
                            rq.push_back(nr);
                            cq.push_back(nc);
                        }
                    }
                }

                // 経路復元
                const used = new Array(n * n);
                if (D[gr * n + gc] < inf) {
                    // ゴールにたどり着けている
                    let r = gr;
                    let c = gc;
                    used[r * n + c] = 1;
                    while (r != sr || c != sc) {
                        const cur = r * n + c;
                        for (let dir = 0; dir < 4; dir++) {
                            const nr = r + dr[dir];
                            const nc = c + dc[dir];
                            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;  // 外
                            const nex = nr * n + nc;

                            if (D[nex] == D[cur] - 1) {
                                r = nr;
                                c = nc;
                                used[r * n + c] = 1;
                                break;
                            }
                        }
                    }
                }

                // 最短路以外を inf で埋め戻し
                for (let r = 0; r < n; r++) {
                    for (let c = 0; c < n; c++) {
                        if (D[r * n + c] != -1) {
                            if (used[r * n + c] != 1) D[r * n + c] = inf;
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
        }
    }

    export const init = () => {
        const file1 = <HTMLInputElement> document.getElementById("file1");
        const file2 = <HTMLInputElement> document.getElementById("file2");
        const scoreInput = <HTMLInputElement> document.getElementById("score");
        const distInput = <HTMLInputElement> document.getElementById("dist");
        const dist2Input = <HTMLInputElement> document.getElementById("dist2");

        // controls
        const seek = <HTMLInputElement> document.getElementById("seek");
        const pos = <HTMLInputElement> document.getElementById("pos");
        const firstButton = <HTMLInputElement> document.getElementById("firstButton");
        const prevButton = <HTMLInputElement> document.getElementById("prevButton");
        const playButton = <HTMLInputElement> document.getElementById("playButton");
        const nextButton = <HTMLInputElement> document.getElementById("nextButton");
        const lastButton = <HTMLInputElement> document.getElementById("lastButton");
        const maxfps = <HTMLInputElement> document.getElementById("maxfps");
        const exportButton = <HTMLInputElement> document.getElementById("exportButton");

        const canvas = <HTMLCanvasElement> document.getElementById("canvas");
        const ctx = canvas.getContext('2d');

        if (ctx == null) {
            return () => {
                alert('未対応ブラウザです');
            };
        }
        const load_to = (file: File, callback: (value: string) => void) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onloadend = function () {
                callback(reader.result);
            }
        };

        let id: number | null = null;

        const run = (value1: string, value2: string) => {
            scoreInput.value = '0';
            seek.min = seek.max = pos.value = seek.value = '0';
            pos.step = seek.step = '1';

            let testCase: TestCase;
            try {
                testCase = new TestCase(value1);
            }
            catch (e) {
                alert(e);
                console.warn(e);
                scoreInput.value = 'ERROR at input';
                return;
            }

            let frames: Frame[];
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
            const n = testCase.n;
            canvas.width = 800;
            canvas.height = 800;
            const width = canvas.width;
            const height = canvas.height;

            const cell_width = Math.floor(width / n);
            const cell_height = Math.floor(height / n);

            const wallColor = '#7a571e';
            const floorColor = '#fcedd4';
            const floorBorderColor = '#f1e2c9';
            const floorBorderColor2 = '#d1c2a9';
            const startColor = '#00f';
            const goalColor = '#f00';
            const currentFloorColor = '#222';
            const currentWallColor = '#ccc';

            const ctop = (y: number) => {
                return y * cell_height;
            };

            const clef = (x: number) => {
                return x * cell_width;
            };

            const draw = (frame: Frame) => {
                const drawFloor = (r: number, c: number) => {
                    const dist = frame.D[r * n + c];
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = floorBorderColor;
                    if (dist == inf) {
                        // 未到達
                        const y = ctop(r);
                        const x = clef(c);
                        ctx.strokeRect(x, y, cell_width, cell_height);
                    }
                };
                const drawBorders = () => {
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    // 縦線
                    const yt = ctop(0);
                    const yb = ctop(n + 1);
                    for (let c = 5; c < n; c += 5) {
                        const x = clef(c);
                        ctx.moveTo(x, yt);
                        ctx.lineTo(x, yb);
                    }
                    // 横線
                    const xl = clef(0);
                    const xr = clef(n + 1);
                    for (let r = 5; r < n; r += 5) {
                        const y = ctop(r);
                        ctx.moveTo(xl, y);
                        ctx.lineTo(xr, y);
                    }

                    ctx.strokeStyle = floorBorderColor2;
                    ctx.stroke();
                };
                const drawCell = (r: number, c: number) => {
                    const dist = frame.D[r * n + c];
                    if (dist == inf) return;
                    else if (dist == -1) {
                        // 壁
                        ctx.fillStyle = wallColor;
                    }
                    else if (dist < inf) {
                        // 到達可能
                        ctx.fillStyle = distColors[dist % distColors.length];
                    }
                    const y = ctop(r);
                    const x = clef(c);
                    ctx.fillRect(x, y, cell_width, cell_height);
                };

                ctx.fillStyle = floorColor;
                ctx.fillRect(0, 0, width, height);

                // 床描画
                for (let r = 0; r < n; r++) {
                    for (let c = 0; c < n; c++) {
                        drawFloor(r, c);
                    }
                }

                // 枠線描画
                drawBorders();

                // 描画
                for (let r = 0; r < n; r++) {
                    for (let c = 0; c < n; c++) {
                        drawCell(r, c);
                    }
                }

                if (frame.dist > 0) {
                    // 到達可能
                    ctx.shadowBlur = cell_width;
                    // 始点
                    {
                        const r = testCase.A[frame.turn];
                        const c = testCase.B[frame.turn];
                        ctx.fillStyle = ctx.shadowColor = distColors[0];
                        const y = ctop(r);
                        const x = clef(c);
                        ctx.fillRect(x, y, cell_width, cell_height);
                    }
                    // 終点
                    {
                        const r = testCase.C[frame.turn];
                        const c = testCase.D[frame.turn];
                        ctx.fillStyle = ctx.shadowColor = distColors[frame.dist % 360];
                        const y = ctop(r);
                        const x = clef(c);
                        ctx.fillRect(x, y, cell_width, cell_height);
                    }
                    ctx.shadowBlur = 0;
                }
                else {
                    // 到達不能
                    ctx.shadowBlur = cell_width / 2;
                    // 始点
                    {
                        const r = testCase.A[frame.turn];
                        const c = testCase.B[frame.turn];
                        ctx.strokeStyle = ctx.shadowColor = startColor;
                        const y = ctop(r);
                        const x = clef(c);
                        ctx.strokeRect(x + 2, y + 2, cell_width - 4, cell_height - 4);
                    }

                    // 終点
                    {
                        const r = testCase.C[frame.turn];
                        const c = testCase.D[frame.turn];
                        ctx.strokeStyle = ctx.shadowColor = goalColor;
                        const y = ctop(r);
                        const x = clef(c);
                        ctx.strokeRect(x + 2, y + 2, cell_width - 4, cell_height - 4);
                    }
                    ctx.shadowBlur = 0;
                }

                // そのターンの操作
                if (frame.r != -1 && frame.c != -1) {
                    const r = frame.r;
                    const c = frame.c;
                    if (frame.D[r * n + c] == -1) {
                        // 壁にした
                        ctx.strokeStyle = currentWallColor;
                    }
                    else {
                        // 床にした
                        ctx.strokeStyle = currentFloorColor;
                    }
                    ctx.lineWidth = 2;
                    const y = ctop(r);
                    const x = clef(c);
                    ctx.strokeRect(x + 2, y + 2, cell_width - 4, cell_height - 4);
                }
            };

            // 以下、ボタン類のコールバックとか

            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 表示するやつ
            const d = () => {
                let frame = frames[parseInt(seek.value)];
                draw(frame);
                scoreInput.value = Math.ceil(frame.totalScore / 10000.0).toString();
                distInput.value = frame.dist < 0 ? "-" : frame.dist.toString();
                dist2Input.value = frame.score.toString();
            };

            let fps = parseInt(maxfps.value);
            let updateInterval = 1000 / fps;

            // 最終フレームを表示
            pos.value = pos.max = seek.value = seek.max = (frames.length - 1).toString();
            d();

            seek.onchange = seek.oninput = () => {
                pos.value = seek.value;
                d();
            };
            pos.onchange = () => {
                seek.value = pos.value;
                d();
            };
            firstButton.onclick = () => {
                seek.value = pos.value = seek.min;
                d();
            };
            const gotoPrevFrame = prevButton.onclick = () => {
                let f = parseInt(seek.value);
                if (f > 0) {
                    f--;
                    pos.value = seek.value = f.toString();
                    d();
                }
            };
            const gotoNextFrame = nextButton.onclick = () => {
                let f = parseInt(seek.value);
                if (f < frames.length - 1) {
                    f++;
                    pos.value = seek.value = f.toString();
                    d();
                }
            };
            lastButton.onclick = () => {
                pos.value = seek.value = seek.max;
                d();
            };

            // 矢印キー左右で移動
            window.onkeydown = (e: KeyboardEvent) => {
                if (e.target == seek) return;
                switch (e.keyCode) {
                    case 37:
                        gotoPrevFrame();
                        break;
                    case 39:
                        gotoNextFrame();
                        break;
                }
            };

            const play = () => {
                if (seek.value == seek.max) {
                    seek.value = '0';
                }
                const stop = () => {
                    if (id != null) {
                        clearInterval(id);
                        playButton.onclick = play;
                        id = null;
                    }
                };
                id = setInterval(() => {
                    let f = parseInt(seek.value);
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

            maxfps.onchange = () => {
                let v = parseInt(maxfps.value);
                updateInterval = 1000 / v;
                console.log(updateInterval);
                if (id != null) {
                    clearInterval(id);
                    play();
                }
            };

            exportButton.onclick = () => {
                const dataURL = canvas.toDataURL('image/png');
                const anchor = document.createElement('a');
                anchor.href = dataURL;
                anchor.download = 'visualizer.png';
                const e = document.createEvent('MouseEvent');
                e.initEvent("click", true, true);
                anchor.dispatchEvent(e);

                // anchor.dispatchEvent(new CustomEvent('click'));
            };

            playButton.onclick = play;
            playButton.focus();
        };

        return () => {
            if (id != null) clearInterval(id);
            id = null;
            file1.files && load_to(file1.files[0], (value1: string) => {
                file2.files && load_to(file2.files[0], (value2: string) => {
                    run(value1.trim(), value2.trim());
                });
            });
        };
    };
}

window.onload = () => {
    (<HTMLButtonElement> document.getElementById("run")).onclick = visualizer.init();
};
