export class _PerformanceStats {
    private mainStarts = new Map<string, number>();
    private sectionStarts = new Map<string, number>();

    private mainStats = new Map<string, {
        samples: number[];
        last: number;
    }>();

    private sectionStats = new Map<string, {
        count: number;
        total: number;
        min: number;
        max: number;
        last: number;
    }>();

    constructor(
        private readonly rollingWindow = 1000
    ) {}

    begin(name: string): void {
        this.mainStarts.set(name, performance.now());
    }

    end(name: string): number {
        const start = this.mainStarts.get(name);

        if (start === undefined) {
            console.warn(`[PerformanceStats] "${name}" was not started.`);
            return 0;
        }

        const elapsed = performance.now() - start;

        this.mainStarts.delete(name);

        let stat = this.mainStats.get(name);

        if (!stat) {
            stat = {
                samples: [],
                last: 0,
            };

            this.mainStats.set(name, stat);
        }

        stat.last = elapsed;
        stat.samples.push(elapsed);

        if (stat.samples.length > this.rollingWindow) {
            stat.samples.shift();
        }

        return elapsed;
    }

    request(name: string) {
        const stat = this.mainStats.get(name);

        if (!stat) {
            return undefined;
        }

        const average =
            stat.samples.reduce((sum, value) => sum + value, 0) /
            stat.samples.length;

        return {
            name,
            last: stat.last,
            average,
            samples: stat.samples.length,
        };
    }

    beginSection(name: string): void {
        this.sectionStarts.set(name, performance.now());
    }

    endSection(name: string): number {
        const start = this.sectionStarts.get(name);

        if (start === undefined) {
            console.warn(
                `[PerformanceStats] Section "${name}" was not started.`
            );

            return 0;
        }

        const elapsed = performance.now() - start;

        this.sectionStarts.delete(name);

        let stat = this.sectionStats.get(name);

        if (!stat) {
            stat = {
                count: 0,
                total: 0,
                min: Infinity,
                max: 0,
                last: 0,
            };

            this.sectionStats.set(name, stat);
        }

        stat.count++;
        stat.total += elapsed;
        stat.last = elapsed;

        stat.min = Math.min(stat.min, elapsed);
        stat.max = Math.max(stat.max, elapsed);

        return elapsed;
    }

    table(): void {
        const rows: Record<string, {
            calls: number;
            last: string;
            average: string;
            min: string;
            max: string;
            total: string;
        }> = {};

        for (const [name, stat] of this.sectionStats) {
            rows[name] = {
                calls: stat.count,
                last: `${stat.last.toFixed(3)} ms`,
                average: `${(stat.total / stat.count).toFixed(3)} ms`,
                min: `${stat.min.toFixed(3)} ms`,
                max: `${stat.max.toFixed(3)} ms`,
                total: `${stat.total.toFixed(3)} ms`,
            };
        }

        console.table(rows);
    }

    reset(): void {
        this.mainStarts.clear();
        this.sectionStarts.clear();
        this.mainStats.clear();
        this.sectionStats.clear();
    }

    resetSections(): void {
        this.sectionStarts.clear();
        this.sectionStats.clear();
    }
}

export const PerformanceStats = (globalThis as any).PerformanceStats = new _PerformanceStats();