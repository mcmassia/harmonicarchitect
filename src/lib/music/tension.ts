import { Note } from "@tonaljs/tonal";

// Approximate Unit Weights (lbs/inch) for typically used plain steel (P) and nickel wound (NW) strings
// Based on D'Addario XL Nickel Wound charts
const UNIT_WEIGHTS: Record<number, number> = {
    // Plain Steel
    0.007: 0.00001086,
    0.008: 0.00001418,
    0.009: 0.00001795,
    0.010: 0.00002215,
    0.011: 0.00002680,
    0.012: 0.00003189,
    0.013: 0.00003744,

    // Wound (Approximate interpolation for common gauges)
    0.017: 0.00005697,
    0.018: 0.00006277,
    0.020: 0.00008064,
    0.022: 0.00009744,
    0.024: 0.00011889,
    0.026: 0.00013958,
    0.028: 0.00016575,
    0.030: 0.00019056,
    0.032: 0.00021676,
    0.034: 0.00024765,
    0.036: 0.00027787,
    0.038: 0.00030932,
    0.040: 0.00034407,
    0.042: 0.00037912,
    0.044: 0.00041830,
    0.046: 0.00045610,
    0.048: 0.00049755,
    0.049: 0.00052210,
    0.050: 0.00053910,
    0.052: 0.00058444,
    0.054: 0.00063266,
    0.056: 0.00068132,
    0.059: 0.00075591,
    0.060: 0.00077890,
    0.062: 0.00083321,
    0.064: 0.00089291,
    0.066: 0.00094709,
    0.068: 0.00100780,
    0.070: 0.00106950,
    0.072: 0.00113008,
    0.074: 0.00119615,
    0.080: 0.00139945,
};

/**
 * Calculate tension helper
 * Formula: T (lbs) = (UW * (2 * L * F)^2) / 386.4
 * @param unitWeight - lbs per linear inch
 * @param scaleLength - inches
 * @param frequency - Hz
 */
export function calculateTension(gauge: number, scaleLength: number, note: string): number {
    const f = Note.freq(note);
    if (!f) return 0;

    // Find closest unit weight if exact gauge missing
    let uw = UNIT_WEIGHTS[gauge];
    if (!uw) {
        // Simple fallback or closest match
        // For now, let's try to find closest key
        const gauges = Object.keys(UNIT_WEIGHTS).map(Number).sort((a, b) => a - b);
        const closest = gauges.reduce((prev, curr) => {
            return (Math.abs(curr - gauge) < Math.abs(prev - gauge) ? curr : prev);
        });
        uw = UNIT_WEIGHTS[closest];
    }

    const tension = (uw * Math.pow(2 * scaleLength * f, 2)) / 386.4;
    return parseFloat(tension.toFixed(2));
}

export function getTensionStatus(tension: number) {
    if (tension > 30) return "DANGER";
    if (tension > 25) return "HIGH";
    if (tension < 12) return "LOOSE";
    return "OK";
}
