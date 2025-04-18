import React, { useState } from 'react';

export default function Accordion({ summary, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-2">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {summary}
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[500px]' : 'max-h-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
