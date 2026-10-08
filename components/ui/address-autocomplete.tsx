'use client';

import { useEffect, useRef, useState } from 'react';

import { CONTROL } from '@/components/ui/field';

type Suggestion = { label: string; lat: number; lng: number };

/**
 * Address field that suggests real addresses as you type (from /api/places).
 * When `required`, the form can't be submitted until one of the suggestions
 * has actually been picked — so the coordinates behind the text are always
 * known. The chosen address submits as `name`, and its coordinates as
 * `latName` / `lngName` when those are given.
 */
export function AddressAutocomplete({
  id,
  name = 'address',
  latName,
  lngName,
  defaultAddress = '',
  defaultLat,
  defaultLng,
  required = false,
  placeholder = 'Start typing an address',
}: {
  id?: string;
  name?: string;
  latName?: string;
  lngName?: string;
  defaultAddress?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  required?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState(defaultAddress);
  const [selected, setSelected] = useState<Suggestion | null>(
    defaultAddress && defaultLat != null && defaultLng != null
      ? { label: defaultAddress, lat: defaultLat, lng: defaultLng }
      : null
  );
  const [options, setOptions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Required means "a real, picked address" — not just any typed text.
  useEffect(() => {
    inputRef.current?.setCustomValidity(
      required && !selected ? 'Please choose an address from the suggestions.' : ''
    );
  }, [required, selected]);

  useEffect(() => {
    const query = text.trim();
    if (selected && selected.label === text) return;
    if (query.length < 3) {
      setOptions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/places?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { suggestions: Suggestion[] };
        setOptions(data.suggestions);
        setActive(-1);
        setOpen(true);
      } catch {
        // Aborted by the next keystroke, or offline — nothing to show.
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, selected]);

  function choose(option: Suggestion) {
    setText(option.label);
    setSelected(option);
    setOpen(false);
    setOptions([]);
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className={CONTROL}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        required={required}
        placeholder={placeholder}
        value={text}
        onChange={(event) => {
          const value = event.target.value;
          setText(value);
          if (selected && selected.label !== value) setSelected(null);
        }}
        onFocus={() => options.length > 0 && setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (!open || options.length === 0) return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((i) => (i + 1) % options.length);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
          } else if (event.key === 'Enter' && active >= 0) {
            event.preventDefault();
            choose(options[active]);
          } else if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
      />

      {/* Picked address (or, when optional, whatever was typed) is what submits. */}
      <input type="hidden" name={name} value={selected?.label ?? (required ? '' : text)} />
      {latName && <input type="hidden" name={latName} value={selected?.lat ?? ''} />}
      {lngName && <input type="hidden" name={lngName} value={selected?.lng ?? ''} />}

      {open && options.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-espresso-700/15 bg-white py-1 shadow-lift"
        >
          {options.map((option, index) => (
            <li
              key={option.label}
              role="option"
              aria-selected={index === active}
              // mousedown (not click) so the input's blur doesn't close the list first
              onMouseDown={(event) => {
                event.preventDefault();
                choose(option);
              }}
              className={`cursor-pointer px-4 py-2 text-sm text-espresso-700 ${
                index === active ? 'bg-gold-50' : 'hover:bg-bone'
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
