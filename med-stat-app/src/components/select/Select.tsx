import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

import "./Select.scss";

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "— انتخاب کنید —",
  disabled = false,
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const commitSelection = (index: number) => {
    const opt = options[index];
    if (!opt) return;
    onChange(String(opt.value));
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
        const currentIndex = options.findIndex((opt) => String(opt.value) === String(value));
        setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commitSelection(activeIndex);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`custom-select ${open ? "open" : ""} ${disabled ? "disabled" : ""} ${className}`}
    >
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? "" : "placeholder"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={18} className="chevron" />
      </button>

      {open && (
        <ul className="custom-select-list" role="listbox">
          {options.length === 0 && (
            <li className="custom-select-empty">موردی یافت نشد</li>
          )}

          {options.map((opt, index) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={`custom-select-option ${isSelected ? "selected" : ""} ${
                  index === activeIndex ? "active" : ""
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commitSelection(index)}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={16} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
