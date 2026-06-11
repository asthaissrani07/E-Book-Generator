import React, { useEffect, useRef } from 'react';

interface EditableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  html: string;
  onChange: (val: string) => void;
  isTextOnly?: boolean;
  tagName?: 'div' | 'h2' | 'h1' | 'span';
}

export const Editable: React.FC<EditableProps> = ({
  html,
  onChange,
  isTextOnly = false,
  tagName = 'div',
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);

  useEffect(() => {
    // Only update innerHTML/innerText if the element is not currently focused
    if (ref.current && !isFocused.current) {
      if (isTextOnly) {
        if (ref.current.innerText !== html) {
          ref.current.innerText = html;
        }
      } else {
        if (ref.current.innerHTML !== html) {
          ref.current.innerHTML = html;
        }
      }
    }
  }, [html, isTextOnly]);

  const Tag = tagName as any;

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => {
        isFocused.current = true;
      }}
      onBlur={(e: any) => {
        isFocused.current = false;
        onChange(isTextOnly ? e.currentTarget.innerText : e.currentTarget.innerHTML);
      }}
      style={{ outline: 'none' }}
      {...props}
    />
  );
};
