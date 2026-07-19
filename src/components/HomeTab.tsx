import { addDays } from 'date-fns';
import { useLayoutEffect, useRef, useState } from 'react';
import DayCardBody from './DayCardBody';
import { dateKey } from '../utils/period';
import './HomeTab.css';

const SWIPE_THRESHOLD = 60;
const TRANSITION_MS = 260;

interface Slide {
  direction: 1 | -1;
  fromDate: Date;
}

const HomeTab = () => {
  const [date, setDate] = useState(() => new Date());
  const [slide, setSlide] = useState<Slide | null>(null);
  const [moved, setMoved] = useState(false);
  const dragStartX = useRef<number | null>(null);

  const goDay = (delta: number) => {
    if (slide) return;
    setSlide({ direction: delta > 0 ? 1 : -1, fromDate: date });
    setMoved(false);
    setDate((d) => addDays(d, delta));
  };

  useLayoutEffect(() => {
    if (!slide) return;
    const raf = requestAnimationFrame(() => setMoved(true));
    return () => cancelAnimationFrame(raf);
  }, [slide]);

  const handleTransitionEnd = () => {
    setSlide(null);
    setMoved(false);
  };

  // transitionend can be missed (e.g. the tab was backgrounded mid-swipe),
  // so fall back to a timer that guarantees the extra slot gets cleaned up.
  useLayoutEffect(() => {
    if (!moved) return;
    const timer = setTimeout(handleTransitionEnd, TRANSITION_MS + 120);
    return () => clearTimeout(timer);
  }, [moved]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (dx > SWIPE_THRESHOLD) goDay(-1);
    else if (dx < -SWIPE_THRESHOLD) goDay(1);
  };

  // Before the animated frame, the outgoing card must stay in view; direction
  // decides whether that means the track's resting position is 0% (outgoing
  // card first) or -50% (outgoing card second).
  const restsAtZero = slide ? slide.direction > 0 : true;
  const showingRest = slide ? !moved : true;
  const trackStyle = slide
    ? { width: '200%', transform: `translateX(${showingRest === restsAtZero ? '0%' : '-50%'})` }
    : { width: '100%', transform: 'translateX(0%)' };

  return (
    <div className="screen home-tab">
      <div className="day-card" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <button className="day-card__nav" onClick={() => goDay(-1)} aria-label="前の日">
          ‹
        </button>

        <div className="day-card__viewport">
          <div className="day-card__track" style={trackStyle} onTransitionEnd={handleTransitionEnd}>
            {slide && slide.direction > 0 && (
              <div className="day-card__slot" key={`from-${dateKey(slide.fromDate)}`}>
                <DayCardBody date={slide.fromDate} />
              </div>
            )}
            <div className="day-card__slot" key={`current-${dateKey(date)}`}>
              <DayCardBody date={date} />
            </div>
            {slide && slide.direction < 0 && (
              <div className="day-card__slot" key={`from-${dateKey(slide.fromDate)}`}>
                <DayCardBody date={slide.fromDate} />
              </div>
            )}
          </div>
        </div>

        <button className="day-card__nav" onClick={() => goDay(1)} aria-label="次の日">
          ›
        </button>
      </div>
    </div>
  );
};

export default HomeTab;
