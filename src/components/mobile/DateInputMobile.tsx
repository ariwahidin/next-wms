
import { CircleX, CrossIcon, Trash, X } from 'lucide-react';
import React, { useState } from 'react';

// Component yang bisa langsung dipakai
const DateInputMobile = ({ value, onChange }) => {
    const today = new Date();
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    // Parse value jika sudah ada (format yyyy-mm-dd)
    React.useEffect(() => {
        if (value && value.length === 10) {
            const [y, m, d] = value.split('-');
            setYear(y);
            setMonth(parseInt(m).toString());
            setDay(parseInt(d).toString());
        }
    }, []);

    const handleNumberInput = (val, setter, max) => {
        const num = val.replace(/[^0-9]/g, '');
        if (num === '' || parseInt(num) <= max) {
            setter(num);
        }
    };

    const updateParentValue = (d, m, y) => {
        if (d && m && y && y.length === 4) {
            const formatted = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            onChange({ target: { value: formatted } });
        } else {
            onChange({ target: { value: '' } });
        }
    };

    const handleDayChange = (val) => {
        handleNumberInput(val, setDay, 31);
        updateParentValue(val, month, year);
    };

    const handleMonthChange = (val) => {
        handleNumberInput(val, setMonth, 12);
        updateParentValue(day, val, year);
    };

    const handleYearChange = (val) => {
        const num = val.replace(/[^0-9]/g, '').slice(0, 4);
        setYear(num);
        updateParentValue(day, month, num);
    };

    const setToday = () => {
        const d = today.getDate().toString();
        const m = (today.getMonth() + 1).toString();
        const y = today.getFullYear().toString();
        setDay(d);
        setMonth(m);
        setYear(y);
        updateParentValue(d, m, y);
    };

    const setYesterday = () => {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const d = yesterday.getDate().toString();
        const m = (yesterday.getMonth() + 1).toString();
        const y = yesterday.getFullYear().toString();
        setDay(d);
        setMonth(m);
        setYear(y);
        updateParentValue(d, m, y);
    };

    const clearDate = () => {
        setDay('');
        setMonth('');
        setYear('');
        onChange({ target: { value: '' } });
    };

    return (
        <div className="space-y-3">
            {/* Quick Buttons */}
            {/* <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={setToday}
                    className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium active:bg-blue-600"
                >
                    Hari ini
                </button>
                <button
                    type="button"
                    onClick={setYesterday}
                    className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium active:bg-blue-600"
                >
                    Kemarin
                </button>
            </div> */}

            {/* Manual Input */}
            <div className="flex gap-2 items-center">
                <div className="flex-1">
                    <input
                        type="tel"
                        value={day}
                        onChange={(e) => handleDayChange(e.target.value)}
                        placeholder="DD"
                        maxLength={2}
                        className="w-[55px] p-1 text-xs text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <span className="text-gray-400">/</span>
                <div className="flex-1">
                    <input
                        type="tel"
                        value={month}
                        onChange={(e) => handleMonthChange(e.target.value)}
                        placeholder="MM"
                        maxLength={2}
                        className="w-[60px] p-1 text-xs text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <span className="text-gray-400">/</span>
                <div className="flex-1">
                    <input
                        type="tel"
                        value={year}
                        onChange={(e) => handleYearChange(e.target.value)}
                        placeholder="YYYY"
                        maxLength={4}
                        className="w-[80px] p-1 text-xs text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                </div>
                {(day || month || year) && (
                    <button
                        type="button"
                        onClick={clearDate}
                        className="px-3 py-2.5 text-gray-500 hover:text-gray-700 text-sm"
                    >
                        <CircleX size={16} />
                    </button>
                )}
            </div>

            {/* Preview */}
            {value && (
                <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded mt-11" >
                    {new Date(value).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })}
                </div>
            )}
        </div>
    );
};

export default DateInputMobile;