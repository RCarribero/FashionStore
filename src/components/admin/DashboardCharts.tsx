import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface DashboardChartsProps {
    salesData: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            borderColor: string;
            backgroundColor: string;
        }[];
    };
    orderStatusData: {
        labels: string[];
        datasets: {
            data: number[];
            backgroundColor: string[];
        }[];
    };
}

export default function DashboardCharts({ salesData, orderStatusData }: DashboardChartsProps) {
    const lineOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: '#94a3b8' }
            },
            title: {
                display: true,
                text: 'Ventas de los Últimos 7 Días',
                color: '#fff'
            },
        },
        scales: {
            y: {
                grid: { color: '#1e293b' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { color: '#1e293b' },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: { color: '#94a3b8' }
            },
            title: {
                display: true,
                text: 'Distribución de Estados',
                color: '#fff'
            }
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
                <Line options={lineOptions} data={salesData} />
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg flex items-center justify-center">
                <div className="w-full max-w-md">
                    <Doughnut options={doughnutOptions} data={orderStatusData} />
                </div>
            </div>
        </div>
    );
}
