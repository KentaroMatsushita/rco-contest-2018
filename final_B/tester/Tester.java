import java.io.*;
import java.util.Arrays;
import java.util.Random;
import java.util.Scanner;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinTask;
import java.util.concurrent.TimeUnit;

public class Tester {

    private static int N = 3000;
    private static int M = 7;
    private static int Q = 30000;
    private static final double MIN_D = 1;
    private static final double MAX_D = 10;

    static class XorShift {
        long x = 88172645463325252L;

        void setSeed(long seed) {
            x = seed;
        }

        long next() {
            x ^= x << 13;
            x ^= x >>> 7;
            x ^= x << 17;
            return x;
        }

        int nextInt(int n) {
            long upper = Long.divideUnsigned(-1, n) * n;
            long v = next();
            while (Long.compareUnsigned(v, upper) >= 0) {
                v = next();
            }
            return (int)Long.remainderUnsigned(v, n);
        }

        double nextDouble() {
            long v = next() >>> 11;
            return (double)v / (1L << 53);
        }
    }

    static class State {
        XorShift rnd = new XorShift();
        char[] S;
        double D;
        int[] start;
        String[] q;
        int[][] qp;
        double score;

        State(long seed) {
            if (seed != 0) rnd.setSeed(seed);
        }

        void generate() {
            q = new String[Q];
            qp = new int[Q][M];
            start = new int[Q];
            char[] buf = new char[M];
            for (int i = 0; i < Q; i++) {
                start[i] = rnd.nextInt(N);
                for (int j = start[i], pos = 0; pos < M; j++) {
                    if (rnd.nextDouble() * D < 1.0) {
                        qp[i][pos] = j % N;
                        buf[pos] = S[qp[i][pos]];
                        pos++;
                    }
                }
                q[i] = String.valueOf(buf);
            }
        }

        void receive(int[] guess) {
            score = 0;
            for (int i = 0; i < Q; i++) {
                int distance = Math.abs(guess[i] - start[i]);
                distance = Math.min(distance, N - distance);
                double singleScore = Math.sqrt(D) * Math.exp(-distance * distance / 25.0);
                if (debug) {
                    System.err.printf("query:%s start:%4d guess:%4d score:%f\n", q[i], start[i], guess[i], singleScore);
                    int begin = (start[i] + N - 5) % N;
                    int end = (qp[i][M - 1] + 5) % N;
                    if (begin < end) {
                        if (begin <= guess[i] && guess[i] <= end) {
                            char[] buf = new char[guess[i] - begin];
                            Arrays.fill(buf, ' ');
                            System.err.print(String.valueOf(buf));
                            System.err.println("v<--guess");
                        } else {
                            System.err.println();
                        }
                        char[] buf = new char[start[i] - begin];
                        Arrays.fill(buf, ' ');
                        System.err.print(String.valueOf(buf));
                        System.err.println("v<--start");
                        System.err.println(String.valueOf(S, begin, end - begin + 1));
                    } else {
                        if (begin <= guess[i] || guess[i] <= end) {
                            char[] buf = new char[(guess[i] - begin + N) % N];
                            Arrays.fill(buf, ' ');
                            System.err.print(String.valueOf(buf));
                            System.err.println("v<--guess");
                        } else {
                            System.err.println();
                        }
                        char[] buf = new char[(start[i] - begin + N) % N];
                        Arrays.fill(buf, ' ');
                        System.err.print(String.valueOf(buf));
                        System.err.println("v<--start");
                        System.err.println(String.valueOf(S, begin, N - begin) + String.valueOf(S, 0, end + 1));
                    }
                    char[] used = new char[(end - begin + N) % N];
                    Arrays.fill(used, ' ');
                    for (int j = 0; j < M; j++) {
                        int p = qp[i][j];
                        used[(p - begin + N) % N] = '^';
                    }
                    System.err.println(String.valueOf(used));
                    System.err.println();
                }
                score += singleScore;
            }
        }

        @Override
        public String toString() {
            return N + " " + M + " " + Q + "\n";
        }
    }

    static class Result {
        long seed;
        long elapsed;
        double score;

        @Override
        public String toString() {
            StringBuilder builder = new StringBuilder();
            builder.append("seed:" + seed + "\n");
            builder.append("elapsed time:" + elapsed / 1000.0 + "s\n");
            builder.append("score:" + (int)Math.ceil(score) + "\n");
            return builder.toString();
        }
    }

    private Result execute(long seed) throws Exception {
        Result res = new Result();
        res.seed = seed;
        State state = new State(seed);
        ProcessBuilder pb = new ProcessBuilder(command.split("\\s+"));
        Process proc = pb.start();
        OutputStream os = proc.getOutputStream();
        ForkJoinTask<?> readError = ForkJoinPool.commonPool().submit(() -> {
            // redirect command stderr
            try (InputStreamReader reader = new InputStreamReader(proc.getErrorStream())) {
                while (true) {
                    int ch = reader.read();
                    if (ch == -1) break;
                    System.err.print((char) ch);
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
        try (Scanner sc = new Scanner(proc.getInputStream())) {
            long startTime = System.currentTimeMillis();
            os.write((N + " " + M + " " + Q + "\n").getBytes());
            os.flush();
            state.S = sc.nextLine().trim().toCharArray();
            if (state.S.length != N) {
                error("invalid length of S: " + state.S.length);
            }
            for (int i = 0; i < N; i++) {
                if (state.S[i] < 'a' || 'z' < state.S[i]) {
                    error("S[" + i + "] is an invalid character: " + state.S[i]);
                }
            }
            String dStr = sc.nextLine().trim();
            try {
                state.D = Double.parseDouble(dStr);
            } catch (NumberFormatException e) {
                error("invalid format of D: " + dStr);
            }
            if (state.D < MIN_D || MAX_D < state.D) {
                error("invalid value of D: " + state.D);
            }
            state.generate();
            int[] guess = new int[Q];
            ForkJoinTask<?> readOutput = ForkJoinPool.commonPool().submit(() -> {
                // read in another thread to avoid stream buffer blocking
                for (int i = 0; i < Q; i++) {
                    String line = sc.nextLine().trim();
                    try {
                        guess[i] = Integer.parseInt(line);
                    } catch (NumberFormatException e) {
                        error("invalid format of guess[" + i + "]: " + line);
                    }
                }
            });
            for (int i = 0; i < Q; i++) {
                os.write((String.valueOf(state.q[i]) + "\n").getBytes());
            }
            os.flush();
            readOutput.get();
            for (int i = 0; i < Q; i++) {
                if (guess[i] < 0 || N <= guess[i]) {
                    error("invalid value of guess[" + i + "]: " + guess[i]);
                }
            }
            state.receive(guess);
            res.elapsed = System.currentTimeMillis() - startTime;
            res.score = state.score;
            readError.get(10, TimeUnit.SECONDS); // wait termination
        } finally {
            proc.destroy();
        }
        return res;
    }

    private static String command;
    private static boolean debug;

    static void error(String message) {
        System.err.println("[ERROR] " + message);
        System.exit(1);
    }

    static void usage() {
        System.err.println("usage: java Tester -command \"command\" [-seed seed] [-Q Q_value] [-debug]");
        System.exit(1);
    }

    public static void main(String[] args) throws Exception {
        long seed = new Random().nextInt();
        for (int i = 0; i < args.length; ++i) {
            if (args[i].equals("-seed")) {
                seed = Long.parseLong(args[++i]);
            } else if (args[i].equals("-command")) {
                command = args[++i];
            } else if (args[i].equals("-debug")) {
                debug = true;
            } else if (args[i].equals("-Q")) {
                Q = Integer.parseInt(args[++i]);
            } else {
                System.err.println("unknown option:" + args[i]);
                usage();
            }
        }
        if (command == null) {
            usage();
        }
        Tester tester = new Tester();
        Result res = tester.execute(seed);
        System.out.print(res);
    }

}
