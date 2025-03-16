// TailwindCalendar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiCalendar } from 'react-icons/fi';

/**
 * TailwindCalendar
 * Componente reutilizable para selección de fechas con calendario emergente.
 * 
 * Props:
 * - selectedDate: Date | null. La fecha seleccionada actual.
 * - onChange(date: Date | null): callback al elegir fecha o “limpiar”.
 * - id: identificador opcional para el input.
 * - className: clases tailwind/extra que desees agregar a la caja contenedora del input.
 */
export default function TailwindCalendar({ selectedDate, onChange, id, className }) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [isOpen, setIsOpen] = useState(false);
  const calendarRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date) => {
    onChange(date);
    setIsOpen(false);
  };

  const navigateMonth = (step) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + step);
    setCurrentDate(newDate);
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Formatea la fecha para input
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d)) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    // Primer día, cantidad de días
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Espacios vacíos antes del día 1
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push(
        <button
          key={`day-${day}`}
          type="button"
          onClick={() => handleDateSelect(date)}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
            isSelected
              ? 'bg-blue-500 text-white'
              : isToday
                ? 'bg-blue-100 text-blue-800'
                : 'hover:bg-gray-100'
          }`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="relative" ref={calendarRef}>
      <div className={`relative ${className || ''}`}>
        <input
          id={id}
          type="text"
          readOnly
          value={selectedDate ? formatDate(selectedDate) : ''}
          placeholder="Seleccionar fecha"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 border rounded-md 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <FiCalendar className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-64">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
            </button>
            <div className="font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="h-8 w-8 flex items-center justify-center text-xs text-gray-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>
          <div className="mt-4 flex justify-between">
            <button
              type="button"
              onClick={() => handleDateSelect(new Date())}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
