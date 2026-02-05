import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface CohortChartProps {
    data: {
        labels: string[]; // e.g., "Jan", "Feb", "Mar"
        datasets: {
            label: string; // e.g., "Retained User %"
            data: number[]; // e.g., 40, 35, 30
            backgroundColor: string;
        }[];
    };
}

export default function CohortChart({ data }: CohortChartProps) {
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: '#94a3b8' }
            },
            title: {
                display: true,
                text: 'Retención de Usuarios (Cohortes Mensuales)',
                color: '#fff'
            },
        },
        scales: {
            y: {
                grid: { color: '#1e293b' },
                ticks: { color: '#94a3b8' },
                beginAtZero: true,
                max: 100
            },
            x: {
                grid: { color: '#1e293b' },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
            <Bar options={options} data={data} />
        </div>
    );
}
