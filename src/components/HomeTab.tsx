import { addDays } from 'date-fns';
import { useLayoutEffect, useRef, useState } from 'react';
import DayCardBody from './DayCardBody';
import { appToday, dateKey } from '../utils/period';
import './HomeTab.css';

const SETTLE_MS = 320;
const COMMIT_DISTANCE_RATIO = 0.28;
const COMMIT_VELOCITY = 0.55; // px/ms
// A near-instant release can report a tiny elapsed time, which inflates
// velocity (dx/dt) even for a small, unintentional movement. Requiring at
// least this much real movement keeps the velocity path from firing on taps.
const MIN_FLICK_DISTANCE = 16;

interface DragState {
  pointerId: number;
  startX: number;
  startT: number;
}

const HomeTab = () => {
  const [date, setDate] = useState(() => appToday());
  const [width, setWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const settlingRef = useRef(false);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setWidth(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const setTrackTransform = (px: number, animate: boolean) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = animate ? `transform ${SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none';
    el.style.transform = `translateX(${px}px)`;
  };

  // Whenever we're not mid-gesture, the track must rest on the "current" slot.
  // Re-running this after date/width changes (rather than hand-managing every
  // reset site) keeps the drag code from having to know when it's safe to snap.
  useLayoutEffect(() => {
    if (settlingRef.current || dragRef.current) return;
    setTrackTransform(-width, false);
  }, [date, width]);

  const settleTo = (target: number, commitDelta: -1 | 0 | 1) => {
    settlingRef.current = true;
    setTrackTransform(target, true);
    const el = trackRef.current;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el?.removeEventListener('transitionend', finish);
      settlingRef.current = false;
      if (commitDelta !== 0) {
        setDate((d) => addDays(d, commitDelta));
      } else {
        setTrackTransform(-width, false);
      }
    };
    el?.addEventListener('transitionend', finish);
    setTimeout(finish, SETTLE_MS + 150);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (settlingRef.current || width === 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture is a reliability nicety for fast drags leaving the element's
      // bounds; if the browser rejects it, tracking still works without it.
    }
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startT: performance.now() };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    setTrackTransform(-width + (e.clientX - drag.startX), false);
  };

  const releaseDrag = (e: React.PointerEvent, commit: boolean) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    dragRef.current = null;

    if (!commit) {
      settleTo(-width, 0);
      return;
    }

    const dx = e.clientX - drag.startX;
    const absDx = Math.abs(dx);
    const dt = Math.max(1, performance.now() - drag.startT);
    const velocity = dx / dt;
    const shouldCommit =
      absDx > width * COMMIT_DISTANCE_RATIO || (absDx > MIN_FLICK_DISTANCE && Math.abs(velocity) > COMMIT_VELOCITY);

    if (shouldCommit && dx < 0) settleTo(-2 * width, 1);
    else if (shouldCommit && dx > 0) settleTo(0, -1);
    else settleTo(-width, 0);
  };

  const prevDate = addDays(date, -1);
  const nextDate = addDays(date, 1);

  return (
    <div className="screen home-tab">
      <div
        className="day-card"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => releaseDrag(e, true)}
        onPointerCancel={(e) => releaseDrag(e, false)}
      >
        <div className="day-card__viewport" ref={viewportRef}>
          <div className="day-card__track" ref={trackRef}>
            <div className="day-card__slot" style={{ flex: `0 0 ${width}px` }} key={`prev-${dateKey(prevDate)}`}>
              <DayCardBody date={prevDate} />
            </div>
            <div className="day-card__slot" style={{ flex: `0 0 ${width}px` }} key={`current-${dateKey(date)}`}>
              <DayCardBody date={date} />
            </div>
            <div className="day-card__slot" style={{ flex: `0 0 ${width}px` }} key={`next-${dateKey(nextDate)}`}>
              <DayCardBody date={nextDate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeTab;
