// SearchInput.jsx
import React, { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import { Search } from 'lucide-react';
import { Input } from './Input';

export function SearchInput({ onSearch, placeholder = "Search..." }) {
  const [value, setValue] = useState('');

  const debouncedSearch = useCallback(
    debounce((term) => onSearch(term), 300),
    [onSearch]
  );

  const handleChange = (e) => {
    setValue(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  );
}