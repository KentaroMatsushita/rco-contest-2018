import java.awt.*;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Scanner;

public class TestCase {

    static final int N_FIXED = 40;
    static final int K_FIXED = 1000;

    int N, K;
    Point[][] terminal;
    SecureRandom rnd;

    TestCase(long seed) throws Exception {
        rnd = SecureRandom.getInstance("SHA1PRNG");
        rnd.setSeed(seed);
        N = N_FIXED;
        K = K_FIXED;
        terminal = new Point[K][2];
        for (int i = 0; i < K; i++) {
            terminal[i][0] = new Point(rnd.nextInt(N), rnd.nextInt(N));
            int r, c;
            do {
                r = rnd.nextInt(N);
                c = rnd.nextInt(N);
            } while (c == terminal[i][0].x && r == terminal[i][0].y);
            terminal[i][1] = new Point(c, r);
        }
    }

    TestCase(Scanner sc) {
        this.N = sc.nextInt();
        this.K = sc.nextInt();
        terminal = new Point[K][2];
        for (int i = 0; i < K; i++) {
            int r0 = sc.nextInt();
            int c0 = sc.nextInt();
            int r1 = sc.nextInt();
            int c1 = sc.nextInt();
            terminal[i][0] = new Point(c0, r0);
            terminal[i][1] = new Point(c1, r1);
        }
    }

    @Override
    public String toString() {
        StringBuilder builder = new StringBuilder();
        builder.append(this.N + " " + this.K + "\n");
        for (Point[] ps : terminal) {
            builder.append(ps[0].y + " " + ps[0].x + " " + ps[1].y + " " + ps[1].x + "\n");
        }
        return builder.toString();
    }

}
