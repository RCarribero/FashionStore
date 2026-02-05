export interface SizeRange {
    size: string;
    label: string;
    minWeight: number; // kg
    maxWeight: number;
    minHeight: number; // cm
    maxHeight: number;
}

export const SIZE_CHART: SizeRange[] = [
    { size: 'S', label: 'Small', minWeight: 50, maxWeight: 65, minHeight: 150, maxHeight: 170 },
    { size: 'M', label: 'Medium', minWeight: 60, maxWeight: 75, minHeight: 165, maxHeight: 180 },
    { size: 'L', label: 'Large', minWeight: 70, maxWeight: 85, minHeight: 170, maxHeight: 185 },
    { size: 'XL', label: 'Extra Large', minWeight: 80, maxWeight: 100, minHeight: 175, maxHeight: 195 },
    { size: 'XXL', label: '2X Large', minWeight: 95, maxWeight: 120, minHeight: 180, maxHeight: 205 },
];

export const findSize = (height: number, weight: number): string | null => {
    // 1. Calculate BMI-like proxy or just find intersection
    // Simple approach: Find size where both H and W fit in range
    // Priority: Weight usually dominates size choice for fit, Height for length.

    // Exact match
    const match = SIZE_CHART.find(s =>
        weight >= s.minWeight && weight <= s.maxWeight &&
        height >= s.minHeight && height <= s.maxHeight
    );

    if (match) return match.size;

    // Soft match (weight dominant)
    const weightMatch = SIZE_CHART.find(s => weight >= s.minWeight && weight <= s.maxWeight);
    if (weightMatch) return weightMatch.size;

    return null;
}
