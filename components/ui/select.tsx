"use client";

import * as React from "react";
import { cn } from "@/components/ui/utils";

type SelectItemData = {
  value: string;
  label: React.ReactNode;
};

type SelectContextValue = {
  items: SelectItemData[];
  setItems: React.Dispatch<React.SetStateAction<SelectItemData[]>>;
  value?: string;
  setValue: (value: string) => void;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within Select");
  }
  return context;
}

export function Select({
  value,
  defaultValue,
  onValueChange,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const [items, setItems] = React.useState<SelectItemData[]>([]);
  const currentValue = value ?? internalValue;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [onValueChange, value]
  );

  return (
    <SelectContext.Provider value={{ items, setItems, value: currentValue, setValue }}>
      {children}
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { items, value, setValue } = useSelectContext();
  const placeholder = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === SelectValue
  ) as React.ReactElement<{ placeholder?: string }> | undefined;

  return (
    <select
      value={value}
      onChange={(event) => setValue(event.target.value)}
      className={cn(
        "flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-400",
        className
      )}
    >
      {placeholder?.props.placeholder ? (
        <option value="" disabled>
          {placeholder.props.placeholder}
        </option>
      ) : null}
      {items.map((item) => (
        <option key={item.value} value={item.value}>
          {typeof item.label === "string" ? item.label : item.value}
        </option>
      ))}
    </select>
  );
}

export function SelectValue(_props: { placeholder?: string }) {
  return null;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const { setItems } = useSelectContext();

  React.useEffect(() => {
    const nextItems = React.Children.toArray(children)
      .filter((child): child is React.ReactElement<{ value: string; children: React.ReactNode }> => {
        return React.isValidElement(child) && child.type === SelectItem;
      })
      .map((child) => ({
        value: child.props.value,
        label: child.props.children,
      }));

    setItems(nextItems);
    return () => setItems([]);
  }, [children, setItems]);

  return null;
}

export function SelectItem(_props: { value: string; children: React.ReactNode }) {
  return null;
}
