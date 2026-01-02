import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChartComponent } from './components/ChartComponent';

// Utils
const generateInitialData = (count = 50) => {
  const data = [];
  let time = Math.floor(Date.now() / 1000) - count * 3; // 3 seconds per candle
  let close = 100 + Math.random() * 50;

  for (let i = 0; i < count; i++) {
    const open = close;
    const volatility = 2;
    const change = (Math.random() - 0.5) * volatility;
    close = open + change;
    const high = Math.max(open, close) + Math.random() * 0.5;
    const low = Math.min(open, close) - Math.random() * 0.5;
    
    data.push({
      time: time + i * 3,
      open,
      high,
      low,
      close,
    });
  }
  return data;
};

function App() {
  // Game State
  const [score, setScore] = useState(100);
  const [prediction, setPrediction] = useState(null); // 'UP' | 'DOWN' | null
  const [lastResult, setLastResult] = useState(null); // { won: boolean, change: number }

  // Chart State
  const [initialData] = useState(() => generateInitialData());
  const [currentCandle, setCurrentCandle] = useState(null);
  
  // Logic Refs
  const currentCandleRef = useRef(null); // Mutable ref for instant updates
  const lastCloseRef = useRef(initialData[initialData.length - 1].close);
  const nextCandleTimeRef = useRef(initialData[initialData.length - 1].time + 3);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(3000); // ms

  // Game Loop
  useEffect(() => {
    // 1. Initialize first live candle
    if (!currentCandleRef.current) {
        const open = lastCloseRef.current;
        const candle = {
            time: nextCandleTimeRef.current,
            open,
            high: open,
            low: open,
            close: open
        };
        currentCandleRef.current = candle;
        setCurrentCandle(candle);
    }

    const interval = setInterval(() => {
      // Update Timer
      setTimeLeft(prev => {
        const newVal = prev - 100;
        if (newVal <= 0) {
            handleCandleClose();
            return 3000;
        }
        return newVal;
      });

      // Update Price (Random Walk)
      if (currentCandleRef.current) {
        const volatility = 0.5; // How much it moves per tick
        const change = (Math.random() - 0.5) * volatility;
        const newClose = currentCandleRef.current.close + change;
        
        currentCandleRef.current = {
            ...currentCandleRef.current,
            close: newClose,
            high: Math.max(currentCandleRef.current.high, newClose),
            low: Math.min(currentCandleRef.current.low, newClose),
        };
        setCurrentCandle({...currentCandleRef.current}); // Trigger render/update
      }

    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Handle Candle Close Logic
  const handleCandleClose = () => {
     // Access latest state via refs or functional updates logic
     // Since this is called inside setTimeLeft, we need to be careful with closures.
     // But we are using refs for candle data, so it is fine.
     
     const finalCandle = currentCandleRef.current;
     const isUp = finalCandle.close >= finalCandle.open;
     
     // Check Prediction (we need latest prediction state)
     // Since this is called from closure, `prediction` might be stale if we didn't use a ref or depend on it.
     // Wait, `handleCandleClose` is defined inside component, but `useEffect` has `[]` dep.
     // So `prediction` WILL be stale (null).
     // FIX: Use a ref for prediction or add deps.
     // Using ref for prediction is easiest for game loop.
  };

  // Re-implementing with proper Ref for prediction to access it in the loop
  const predictionRef = useRef(prediction);
  useEffect(() => { predictionRef.current = prediction; }, [prediction]);

  // Ref for score to update it correctly based on previous
  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // Re-define loop to correctly call handleCandleClose
  // Actually, separating the timer tick and the close logic is cleaner.
  
  // Let's use a single effect with proper mutable refs for everything that changes fast.
  
  useEffect(() => {
     const tickRate = 100;
     const candleDuration = 3000;
     let localTimeLeft = 3000;

     const loop = setInterval(() => {
        localTimeLeft -= tickRate;

        // Price Movement
        if (currentCandleRef.current) {
            const volatility = 0.2; 
            const change = (Math.random() - 0.5) * volatility;
            const newClose = currentCandleRef.current.close + change;
            
            const updatedCandle = {
                ...currentCandleRef.current,
                close: newClose,
                high: Math.max(currentCandleRef.current.high, newClose),
                low: Math.min(currentCandleRef.current.low, newClose),
            };
            currentCandleRef.current = updatedCandle;
            setCurrentCandle(updatedCandle);
        }

        // Candle Close
        if (localTimeLeft <= 0) {
            localTimeLeft = candleDuration;
            
            const closedCandle = currentCandleRef.current;
            const isUp = closedCandle.close >= closedCandle.open;
            
            // Settlement
            const currentPred = predictionRef.current;
            let scoreChange = 0;
            let resultInfo = null;

            if (currentPred) {
                const won = (currentPred === 'UP' && isUp) || (currentPred === 'DOWN' && !isUp);
                if (won) {
                    scoreChange = 10;
                    resultInfo = { won: true, msg: '+10' };
                } else {
                    scoreChange = -5;
                    resultInfo = { won: false, msg: '-5' };
                }
                // Reset prediction
                setPrediction(null); 
            }

            // Update Score
            setScore(prev => prev + scoreChange);
            setLastResult(resultInfo);

            // Prepare Next Candle
            lastCloseRef.current = closedCandle.close;
            nextCandleTimeRef.current += 3;
            
            const newCandle = {
                time: nextCandleTimeRef.current,
                open: closedCandle.close,
                high: closedCandle.close,
                low: closedCandle.close,
                close: closedCandle.close
            };
            currentCandleRef.current = newCandle;
            // setCurrentCandle(newCandle); // Will happen in next tick anyway
        }
        
        // Sync Time UI
        setTimeLeft(localTimeLeft);

     }, tickRate);

     return () => clearInterval(loop);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4">
      
      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 p-4 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <div>
            <h1 className="text-xl font-bold text-gray-100">Market Predictor</h1>
            <p className="text-sm text-gray-400">Next candle in: <span className="text-yellow-400 font-mono">{(timeLeft / 1000).toFixed(1)}s</span></p>
        </div>
        <div className="text-right">
            <p className="text-sm text-gray-400">Score</p>
            <p className={`text-3xl font-bold font-mono ${lastResult?.won ? 'text-green-400' : lastResult ? 'text-red-400' : 'text-white'}`}>
                {score}
            </p>
             {lastResult && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${lastResult.won ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'} animate-pulse`}>
                    {lastResult.msg}
                </span>
            )}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full max-w-2xl bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-700 mb-6 relative">
         <ChartComponent 
            data={initialData} 
            currentCandle={currentCandle} 
            colors={{ backgroundColor: '#1f2937', textColor: '#d1d5db' }}
         />
         
         {/* Overlay Prediction Status */}
         {prediction && (
             <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800/80 backdrop-blur px-4 py-2 rounded-full border border-gray-600 shadow-xl z-10">
                <span className="text-gray-300 mr-2">Betting:</span>
                <span className={`font-bold ${prediction === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                    {prediction}
                </span>
             </div>
         )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-4">
        <button 
            onClick={() => setPrediction('UP')}
            disabled={!!prediction}
            className={`
                group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200
                ${prediction === 'UP' 
                    ? 'bg-green-900/50 border-green-500 cursor-default' 
                    : prediction 
                        ? 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                        : 'bg-gray-800 border-gray-700 hover:border-green-500 hover:bg-gray-700 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-95 cursor-pointer'
                }
            `}
        >
            <span className={`text-2xl font-bold mb-1 ${prediction === 'UP' ? 'text-green-400' : 'text-green-500 group-hover:text-green-400'}`}>UP</span>
            <span className="text-xs text-gray-400 group-hover:text-gray-300">Predict Bullish</span>
        </button>

        <button 
            onClick={() => setPrediction('DOWN')}
            disabled={!!prediction}
             className={`
                group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200
                ${prediction === 'DOWN' 
                    ? 'bg-red-900/50 border-red-500 cursor-default' 
                    : prediction 
                        ? 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                        : 'bg-gray-800 border-gray-700 hover:border-red-500 hover:bg-gray-700 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] active:scale-95 cursor-pointer'
                }
            `}
        >
            <span className={`text-2xl font-bold mb-1 ${prediction === 'DOWN' ? 'text-red-400' : 'text-red-500 group-hover:text-red-400'}`}>DOWN</span>
            <span className="text-xs text-gray-400 group-hover:text-gray-300">Predict Bearish</span>
        </button>
      </div>

      <div className="mt-8 text-gray-500 text-xs text-center">
        Market closes every 3 seconds. Place your prediction before the timer ends!
      </div>

    </div>
  );
}

export default App;