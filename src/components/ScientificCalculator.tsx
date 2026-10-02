import React, { useState } from 'react';
import { X, Delete, RotateCcw } from 'lucide-react';

interface ScientificCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

// Safe tokenized arithmetic parser without any eval or new Function execution
function safeCalculateArithmetic(input: string): number {
  const sanitized = input.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
  if (!/^[\d+\-*/().]+$/.test(sanitized)) {
    throw new Error('Invalid math expression');
  }

  const tokens = sanitized.match(/\d+(\.\d+)?|[+\-*/()]/g);
  if (!tokens || tokens.length === 0) return 0;

  let pos = 0;
  function parsePrimary(): number {
    const t = tokens![pos++];
    if (t === '(') {
      const val = parseAddSub();
      if (tokens![pos++] !== ')') throw new Error('Mismatched paren');
      return val;
    }
    if (t === '-') {
      return -parsePrimary();
    }
    if (t === '+') {
      return parsePrimary();
    }
    const num = parseFloat(t);
    if (isNaN(num)) throw new Error('Invalid number');
    return num;
  }

  function parseMulDiv(): number {
    let val = parsePrimary();
    while (pos < tokens!.length && (tokens![pos] === '*' || tokens![pos] === '/')) {
      const op = tokens![pos++];
      const next = parsePrimary();
      if (op === '*') val *= next;
      else {
        if (next === 0) throw new Error('Divide by zero');
        val /= next;
      }
    }
    return val;
  }

  function parseAddSub(): number {
    let val = parseMulDiv();
    while (pos < tokens!.length && (tokens![pos] === '+' || tokens![pos] === '-')) {
      const op = tokens![pos++];
      const next = parseMulDiv();
      if (op === '+') val += next;
      else val -= next;
    }
    return val;
  }

  return parseAddSub();
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [isRad, setIsRad] = useState(false);
  const [memory, setMemory] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDigit = (d: string) => {
    setDisplay((prev) => (prev === '0' || prev === 'Error' ? d : prev + d));
  };

  const handleClear = () => {
    setDisplay('0');
  };

  const handleBackspace = () => {
    setDisplay((prev) => {
      if (prev.length <= 1 || prev === 'Error') return '0';
      return prev.slice(0, -1);
    });
  };

  const handleOp = (op: string) => {
    setDisplay((prev) => prev + ' ' + op + ' ');
  };

  const handleFunction = (fn: string) => {
    try {
      const val = parseFloat(display);
      let res = 0;
      switch (fn) {
        case 'sin':
          res = isRad ? Math.sin(val) : Math.sin((val * Math.PI) / 180);
          break;
        case 'cos':
          res = isRad ? Math.cos(val) : Math.cos((val * Math.PI) / 180);
          break;
        case 'tan':
          res = isRad ? Math.tan(val) : Math.tan((val * Math.PI) / 180);
          break;
        case 'sqrt':
          if (val < 0) throw new Error('Invalid');
          res = Math.sqrt(val);
          break;
        case 'sqr':
          res = val * val;
          break;
        case 'inv':
          if (val === 0) throw new Error('Divide by zero');
          res = 1 / val;
          break;
        case 'ln':
          if (val <= 0) throw new Error('Invalid');
          res = Math.log(val);
          break;
        case 'log10':
          if (val <= 0) throw new Error('Invalid');
          res = Math.log10(val);
          break;
        case 'exp':
          res = Math.exp(val);
          break;
        default:
          return;
      }
      setDisplay(String(Number(res.toFixed(6))));
    } catch {
      setDisplay('Error');
    }
  };

  const handleEqual = () => {
    try {
      const val = safeCalculateArithmetic(display);
      setDisplay(String(Number(val.toFixed(6))));
    } catch {
      setDisplay('Error');
    }
  };

  return (
    <div className="fixed top-20 right-8 z-50 w-80 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-700 select-none overflow-hidden animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="bg-slate-800 px-3 py-2 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-xs font-semibold tracking-wider text-slate-300">CBT VIRTUAL CALCULATOR</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRad(!isRad)}
            className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-blue-400"
          >
            {isRad ? 'RAD' : 'DEG'}
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-0.5 rounded">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Screen Display */}
      <div className="bg-slate-950 p-3 text-right">
        <div className="text-xs text-slate-400 font-mono h-4 overflow-hidden text-ellipsis">
          {display !== '0' ? display : ''}
        </div>
        <div className="text-2xl font-mono font-bold text-white tracking-wider h-8 overflow-hidden text-ellipsis">
          {display}
        </div>
      </div>

      {/* Buttons Grid */}
      <div className="p-3 grid grid-cols-4 gap-1.5 text-xs font-medium bg-slate-900">
        {/* Row 1 */}
        <button onClick={() => handleFunction('sin')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">sin</button>
        <button onClick={() => handleFunction('cos')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">cos</button>
        <button onClick={() => handleFunction('tan')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">tan</button>
        <button onClick={handleClear} className="p-2 bg-red-600/80 hover:bg-red-600 rounded text-white font-bold flex items-center justify-center">C</button>

        {/* Row 2 */}
        <button onClick={() => handleFunction('ln')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">ln</button>
        <button onClick={() => handleFunction('log10')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">log</button>
        <button onClick={() => handleFunction('sqrt')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">√x</button>
        <button onClick={handleBackspace} className="p-2 bg-amber-600/80 hover:bg-amber-600 rounded text-white flex items-center justify-center">
          <Delete size={14} />
        </button>

        {/* Row 3 */}
        <button onClick={() => handleFunction('sqr')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">x²</button>
        <button onClick={() => handleFunction('inv')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">1/x</button>
        <button onClick={() => handleDigit('(')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">(</button>
        <button onClick={() => handleDigit(')')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">)</button>

        {/* Row 4 */}
        <button onClick={() => handleDigit('7')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm font-semibold">7</button>
        <button onClick={() => handleDigit('8')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm font-semibold">8</button>
        <button onClick={() => handleDigit('9')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm font-semibold">9</button>
        <button onClick={() => handleOp('/')} className="p-2 bg-blue-600/80 hover:bg-blue-600 rounded text-white font-bold">÷</button>

        {/* Row 5 */}
        <button onClick={() => handleDigit('4')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm font-semibold">4</button>
        <button onClick={() => handleDigit('5')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm font-semibold">5</button>
        <button onClick={() => handleDigit('6')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm font-semibold">6</button>
        <button onClick={() => handleOp('*')} className="p-2 bg-blue-600/80 hover:bg-blue-600 rounded text-white font-bold">×</button>

        {/* Row 6 */}
        <button onClick={() => handleDigit('1')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm font-semibold">1</button>
        <button onClick={() => handleDigit('2')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm font-semibold">2</button>
        <button onClick={() => handleDigit('3')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm font-semibold">3</button>
        <button onClick={() => handleOp('-')} className="p-2 bg-blue-600/80 hover:bg-blue-600 rounded text-white font-bold">-</button>

        {/* Row 7 */}
        <button onClick={() => handleDigit('0')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm font-semibold">0</button>
        <button onClick={() => handleDigit('.')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm font-semibold">.</button>
        <button onClick={() => handleDigit(String(Math.PI))} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">π</button>
        <button onClick={() => handleOp('+')} className="p-2 bg-blue-600/80 hover:bg-blue-600 rounded text-white font-bold">+</button>

        {/* Equal button spanning bottom */}
        <button
          onClick={handleEqual}
          className="col-span-4 p-2.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-bold text-sm tracking-wider mt-1"
        >
          = EVALUATE
        </button>
      </div>
    </div>
  );
};
