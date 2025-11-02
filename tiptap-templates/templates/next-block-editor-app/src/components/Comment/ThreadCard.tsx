import { useCallback, useEffect, useRef } from 'react';

interface ThreadCardProps {
  id: string; // Explicitly type the id as a string
  active: boolean;
  open: boolean;
  children: React.ReactNode;
  onClick: (id: string) => void;
  onClickOutside?: () => void;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({
                                                        id,
                                                        active,
                                                        open,
                                                        children,
                                                        onClick,
                                                        onClickOutside,
                                                      }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(id); // 'id' is now typed as 'string'
    }
  }, [id, onClick]);

  useEffect(() => {
    if (!active || !onClickOutside) return;

    const clickHandler = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClickOutside();
      }
    };

    document.addEventListener('click', clickHandler);

    return () => {
      document.removeEventListener('click', clickHandler);
    };
  }, [active, onClickOutside]);

  return (
    <div
      ref={cardRef}
      className={`thread${open ? ' is-open' : ''}${active ? ' is-active' : ''}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};
