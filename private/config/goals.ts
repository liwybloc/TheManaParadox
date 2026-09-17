export interface ProgressionGoal {
    readonly id: string;
    readonly label: string;
    readonly startExponent: f64;
    readonly endExponent: f64;
    readonly maximumBeforeCompletion: f64;
    readonly completion: string;
}

export const PROGRESSION_GOALS: readonly ProgressionGoal[] = [
    { id: "sealed-meridians", label: "Purifying Circuits", startExponent: 0, endExponent: 16, maximumBeforeCompletion: 0.99, completion: "sealed-meridians" },
    { id: "meridian-purification", label: "Purification of Meridians", startExponent: 16, endExponent: 61, maximumBeforeCompletion: 0.99, completion: "meridian-purification" },
    { id: "guild", label: "the Guild", startExponent: 61, endExponent: 210, maximumBeforeCompletion: 0.99, completion: "guild-member" },
    { id: "courage", label: "unleashing Courage", startExponent: 210, endExponent: 290, maximumBeforeCompletion: 0.99, completion: "courage" },
    { id: "condense", label: "Condense", startExponent: 0, endExponent: 308.25471555991675, maximumBeforeCompletion: 1, completion: "first-circle-expanded" },
    { id: "transmutation", label: "Transmutation", startExponent: 0, endExponent: 9e15, maximumBeforeCompletion: 1, completion: "never" },
];
