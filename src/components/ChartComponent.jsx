import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

export const ChartComponent = ({ data, currentCandle, colors: {
    backgroundColor = 'white',
    lineColor = '#2962FF',
    textColor = 'black',
    areaTopColor = '#2962FF',
    areaBottomColor = 'rgba(41, 98, 255, 0.28)',
} = {} }) => {
    const chartContainerRef = useRef();
    const chartRef = useRef(null);
    const seriesRef = useRef(null);

    // Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor,
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            grid: {
                vertLines: { color: '#e1e1e1' },
                horzLines: { color: '#e1e1e1' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: true,
            },
        });

        const newSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        seriesRef.current = newSeries;
        chartRef.current = chart;

        // Set initial data
        if (data && data.length > 0) {
            newSeries.setData(data);
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [backgroundColor, textColor]); // Re-create if colors change (optional, usually static)

    // Update Data
    useEffect(() => {
        if (seriesRef.current && data) {
            // If we're updating the whole history (not common in this game loop, but good for init)
            // Ideally we use update() for live updates
        }
    }, [data]);

    // Handle Live Updates
    useEffect(() => {
        if (seriesRef.current && currentCandle) {
            seriesRef.current.update(currentCandle);
        }
    }, [currentCandle]);

    return (
        <div
            ref={chartContainerRef}
            className="w-full relative"
            style={{ height: '400px' }} // Fixed height container
        />
    );
};
