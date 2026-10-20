import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCursor, setPlaying } from '@/store/features/viewSlice';

export function usePlayback(endTime: number | null, startTime = 0) {
  const dispatch = useAppDispatch();
  const playing = useAppSelector((s) => s.view.playing);
  const speed = useAppSelector((s) => s.view.speed);
  const cursor = useAppSelector((s) => s.view.cursor);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;

  useEffect(() => {
    if (!playing || endTime === null) return;
    if (cursorRef.current >= endTime) cursorRef.current = startTime;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const next = Math.min(endTime, cursorRef.current + dt * speed);
      cursorRef.current = next;
      dispatch(setCursor(next));
      if (next >= endTime) {
        dispatch(setPlaying(false));
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, endTime, startTime, dispatch]);
}
