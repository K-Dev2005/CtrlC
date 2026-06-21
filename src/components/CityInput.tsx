import React, { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import citiesData from '../lib/indianCities.json';

interface City {
  id: string;
  name: string;
  state: string;
}

interface CityInputProps {
  label: string;
  placeholder?: string;
  onSelect: (fullCityString: string) => void;
  disabled?: boolean;
}

const fuse = new Fuse<City>(citiesData as City[], {
  keys: [
    { name: "name", weight: 0.7 },
    { name: "state", weight: 0.3 }
  ],
  threshold: 0.35,
  minMatchCharLength: 2
});

export const CityInput: React.FC<CityInputProps> = ({ label, placeholder, onSelect, disabled }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 2) {
      const results = fuse.search(query).map(result => result.item).slice(0, 6);
      setSuggestions(results);
      setIsOpen(true);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [query]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (city: City) => {
    const displayString = `${city.name}, ${city.state}`;
    setQuery(displayString);
    setIsOpen(false);
    onSelect(`${displayString}, India`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-sm relative" ref={wrapperRef}>
      <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          // If user starts typing again, we clear the actual selection in the parent (handled via onSelect outside if needed)
        }}
        onFocus={() => {
          if (query.length >= 2) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Search city...'}
        disabled={disabled}
        className="w-full bg-surface border border-outline-variant rounded p-sm text-body-md focus:border-primary disabled:opacity-50"
      />

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-1 w-full bg-surface border border-outline-variant rounded shadow-lg z-50 overflow-hidden">
          {suggestions.length > 0 ? (
            <ul className="max-h-60 overflow-auto">
              {suggestions.map((city, index) => (
                <li
                  key={`${city.id}-${index}`}
                  onClick={() => handleSelect(city)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-sm py-md text-body-md cursor-pointer transition-colors ${
                    highlightedIndex === index ? 'bg-surface-container-high' : 'hover:bg-surface-container'
                  }`}
                >
                  {city.name}, {city.state}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-sm py-md text-body-md text-on-surface-variant">
              No cities found — try a different spelling
            </div>
          )}
        </div>
      )}
    </div>
  );
};
