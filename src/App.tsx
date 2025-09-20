import { useState, useRef, useEffect, useCallback } from 'react';
import { TrendingUp, RotateCcw, Target, DollarSign } from 'lucide-react';

interface GameResult {
  status: 'win' | 'loss';
  payout?: number;
  crash: number;
}

const EPS = 1e-3;      // small epsilon for float safety
const RATE = 0.8;      // multiplier increase per second
const MIN_TARGET = 1.01;

function App() {
  // Core state
  const [betAmount, setBetAmount] = useState<number>(10);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(2.0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  // Optional balance (not required by the brief, but harmless to keep)
  const [balance, setBalance] = useState<number>(1000);

  // Refs
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const crashValueRef = useRef<number | null>(null);

  // RNG (weighted toward lower values; capped to keep rounds short)
  const generateCrashMultiplier = useCallback((): number => {
    const r = Math.random();
    let crash: number;
    if (r < 0.4) crash = 1.0 + Math.random() * 0.5;       // 1.00–1.50
    else if (r < 0.7) crash = 1.5 + Math.random() * 1.5;   // 1.50–3.00
    else if (r < 0.9) crash = 3.0 + Math.random() * 7.0;   // 3.00–10.00
    else crash = 10.0 + Math.random() * 5.0;               // 10.00–15.00
    return Math.round(crash * 100) / 100;
  }, []);

  const stopAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // FPS-independent animation: decide by *event time*
  const animateCounter = useCallback((timestamp: number) => {
    if (startTimeRef.current === null) startTimeRef.current = timestamp;

    const elapsed = (timestamp - startTimeRef.current) / 1000; // seconds
    const current = 1.0 + elapsed * RATE;
    setCurrentMultiplier(current);

    const crash = crashValueRef.current;
    if (crash == null) {
      // Shouldn’t happen, but guard for TS & safety
      stopAnimation();
      setIsRunning(false);
      return;
    }

    // Compute *exact* event times (continuous), then resolve whichever is first
    const tTarget = (targetMultiplier - 1.0) / RATE;
    const tCrash  = (crash - 1.0) / RATE;
    const tEnd    = Math.min(tTarget, tCrash);

    if (elapsed + EPS >= tEnd) {
      stopAnimation();
      setIsRunning(false);

      if (tTarget <= tCrash + EPS) {
        // WIN (ties go to win)
        const payout = betAmount * targetMultiplier;
        setCurrentMultiplier(targetMultiplier);      // snap
        setResult({ status: 'win', payout, crash });
        setBalance(prev => prev - betAmount + payout);
      } else {
        // LOSS
        setCurrentMultiplier(crash);                 // snap
        setResult({ status: 'loss', crash });
        setBalance(prev => prev - betAmount);
      }

      setHistory(prev => [crash, ...prev].slice(0, 5));
      return;
    }

    animationRef.current = requestAnimationFrame(animateCounter);
  }, [betAmount, targetMultiplier, stopAnimation]);

  const placeBet = useCallback(() => {
    // Keep validation minimal and clear (per brief’s simplicity)
    if (betAmount <= 0) return;
    if (targetMultiplier < MIN_TARGET) return;
    if (betAmount > balance) return; // optional (not required by brief)

    setResult(null);
    setCurrentMultiplier(1.0);
    setIsRunning(true);

    crashValueRef.current = generateCrashMultiplier();
    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animateCounter);
  }, [betAmount, balance, targetMultiplier, generateCrashMultiplier, animateCounter]);

  const resetGame = useCallback(() => {
    stopAnimation();
    setIsRunning(false);
    setCurrentMultiplier(1.0);
    setResult(null);
    startTimeRef.current = null;
    // crashValueRef.current = null; // optional
  }, [stopAnimation]);

  useEffect(() => {
    return stopAnimation; // cleanup on unmount
  }, [stopAnimation]);

  const canPlaceBet =
    !isRunning &&
    betAmount > 0 &&
    targetMultiplier >= MIN_TARGET &&
    betAmount <= balance;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Limbo Game</h1>
          </div>
          <p className="text-slate-300">Beat the crash and multiply your bet!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Game Controls
              </h2>

              {/* Balance (optional per brief) */}
              <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 text-emerald-300">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-medium">Balance</span>
                </div>
                <div className="text-2xl font-bold text-white">${balance.toFixed(2)}</div>
              </div>

              {/* Bet Amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Bet Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={balance}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Target Multiplier */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Target Multiplier</label>
                <input
                  type="number"
                  min={MIN_TARGET}
                  step="0.01"
                  value={targetMultiplier}
                  onChange={(e) => setTargetMultiplier(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={placeBet}
                  disabled={!canPlaceBet}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 transform hover:scale-105 disabled:hover:scale-100"
                >
                  {isRunning ? 'Running...' : 'Place Bet'}
                </button>
                <button
                  onClick={resetGame}
                  // Let reset be available even after round (nice for UX)
                  className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-all duration-200"
                  title="Reset"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Counter & Result */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
              {/* Current Multiplier (ARIA live for accessibility) */}
              <div className="mb-8" role="status" aria-live="polite" aria-atomic="true">
                <div
                  className={`text-8xl font-bold transition-all duration-300 ${
                    isRunning
                      ? 'text-yellow-400 animate-pulse'
                      : result?.status === 'win'
                      ? 'text-emerald-400'
                      : result?.status === 'loss'
                      ? 'text-red-400'
                      : 'text-white'
                  }`}
                >
                  {currentMultiplier.toFixed(2)}×
                </div>
                <div className="text-slate-300 text-lg">
                  {isRunning ? 'Current Multiplier' : 'Final Multiplier'}
                </div>
              </div>

              {/* Result */}
              {result && (
                <div
                  className={`p-6 rounded-xl border-2 transition-all duration-500 ${
                    result.status === 'win'
                      ? 'bg-emerald-500/20 border-emerald-400'
                      : 'bg-red-500/20 border-red-400'
                  }`}
                >
                  <div
                    className={`text-3xl font-bold mb-2 ${
                      result.status === 'win' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {result.status === 'win' ? '🎉 You Win!' : '💥 Crashed!'}
                  </div>
                  <div className="text-white text-lg">
                    {result.status === 'win' ? (
                      <>
                        Payout:{' '}
                        <span className="font-bold text-emerald-400">
                          ${(result.payout ?? 0).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <>
                        Crashed at{' '}
                        <span className="font-bold text-red-400">{result.crash.toFixed(2)}×</span>
                      </>
                    )}
                  </div>
                  {result.status === 'win' && (
                    <div className="text-slate-300 text-sm mt-1">
                      Crashed at {result.crash.toFixed(2)}× (after your cashout)
                    </div>
                  )}
                </div>
              )}

              {/* Target helper */}
              {!result && (
                <div className="text-slate-300">
                  Target:{' '}
                  <span className="text-purple-400 font-semibold">
                    {targetMultiplier.toFixed(2)}×
                  </span>{' '}
                  • Potential Win:{' '}
                  <span className="text-emerald-400 font-semibold">
                    ${(betAmount * targetMultiplier).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* History (bonus) */}
            {history.length > 0 && (
              <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Crashes</h3>
                <div className="flex flex-wrap gap-2">
                  {history.map((crash, index) => (
                    <div
                      key={index}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                        index === 0
                          ? 'bg-red-500/30 text-red-300 ring-1 ring-red-400'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {crash.toFixed(2)}×
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          <p>Enter your bet & target, then try to reach your multiplier before the crash!</p>
        </div>
      </div>
    </div>
  );
}

export default App;
