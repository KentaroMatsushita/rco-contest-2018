import java.awt.*;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Scanner;

public class Judge {

    static final int[] DR = {-1, 0, 1, 0};
    static final int[] DC = {0, 1, 0, -1};
    static boolean debug = false;

    static class Output {
        Point[] changePos;

        Output(TestCase testcase, Scanner sc) {
            changePos = new Point[testcase.K];
            for (int i = 0; i < testcase.K; i++) {
                if (!sc.hasNextLine()) throw new RuntimeException("input must have K lines");
                String line = sc.nextLine();
                String[] coords = line.trim().split(" +");
                if (coords.length != 2) throw new RuntimeException("invalid format at line " + (i + 1) + ":" + line);
                try {
                    int r = Integer.parseInt(coords[0]);
                    int c = Integer.parseInt(coords[1]);
                    changePos[i] = new Point(c, r);
                } catch (NumberFormatException e) {
                    throw new RuntimeException("invalid format at line " + (i + 1) + ":" + line);
                }
            }
        }
    }

    static class Result {
        static final int SCORE_DIVISOR = 10000;
        TestCase input;
        Output output;
        int score;

        @Override
        public String toString() {
            StringBuilder builder = new StringBuilder();
            builder.append("score:" + (score + SCORE_DIVISOR - 1) / SCORE_DIVISOR + "\n");
            return builder.toString();
        }
    }

    static void validateOutput(TestCase testcase, Output output) {
        for (int i = 0; i < testcase.K; i++) {
            int x = output.changePos[i].x;
            int y = output.changePos[i].y;
            if (x == -1) {
                if (y != -1) {
                    throw new RuntimeException("invalid coordinate at line " + (i + 1) + " (" + y + "," + x + ")");
                }
            } else {
                if (x < 0 || testcase.N <= x || y < 0 || testcase.N <= y) {
                    throw new RuntimeException("invalid coordinate at line " + (i + 1) + " (" + y + "," + x + ")");
                }
            }
        }
    }

    static Result calcScore(TestCase testcase, Output output) {
        Result res = new Result();
        res.input = testcase;
        res.output = output;
        boolean[][] wall = new boolean[testcase.N][testcase.N];
        for (int i = 0; i < testcase.K; i++) {
            if (output.changePos[i].x != -1) {
                wall[output.changePos[i].y][output.changePos[i].x] ^= true;
            }
            Point start = testcase.terminal[i][0];
            Point end = testcase.terminal[i][1];
            int d = distance(wall, start, end);
            res.score += d * d;
            if (debug) {
                System.err.print(String.format("(%2d, %2d) -> (%2d, %2d) : ", start.y, start.x, end.y, end.x));
                if (d == 0) {
                    System.err.println("unreachable");
                } else {
                    System.err.println("distance = " + d);
                }
            }
        }
        if (debug) {
            System.err.println("raw score:" + res.score);
        }
        return res;
    }

    static int distance(boolean[][] wall, Point src, Point dst) {
        if (wall[src.y][src.x] || wall[dst.y][dst.x]) return 0;
        int h = wall.length;
        int w = wall[0].length;
        boolean[][] visited = new boolean[h][w];
        ArrayList<Point> cur = new ArrayList<>();
        cur.add(src);
        visited[src.y][src.x] = true;
        for (int i = 1; !cur.isEmpty(); i++) {
            ArrayList<Point> next = new ArrayList<>();
            for (Point p : cur) {
                for (int j = 0; j < 4; j++) {
                    int ny = p.y + DR[j];
                    int nx = p.x + DC[j];
                    if (ny == dst.y && nx == dst.x) return i;
                    if (ny < 0 || h <= ny || nx < 0 || w <= nx || wall[ny][nx] || visited[ny][nx]) continue;
                    visited[ny][nx] = true;
                    next.add(new Point(nx, ny));
                }
            }
            cur = next;
        }
        return 0;
    }

    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("usage: java Judge input_file_path output_file_path [-debug]");
            System.exit(1);
        }
        Path inputFile = Paths.get(args[0]);
        Path outputFile = Paths.get(args[1]);
        if (args.length > 2 && args[2].equals("-debug")) {
            debug = true;
        }
        TestCase testcase = new TestCase(new Scanner(inputFile));
        Output output = new Output(testcase, new Scanner(outputFile));
        validateOutput(testcase, output);
        Result res = calcScore(testcase, output);
        System.out.print(res);
    }

}
