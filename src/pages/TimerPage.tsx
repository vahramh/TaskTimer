import React from 'react';
import { TimerProvider } from '../components/timer/TimerProvider';
import { TimerInterface } from '../components/timer/TimerInterface';

export function TimerPage() {
  return (
    <TimerProvider>
      <TimerInterface />
    </TimerProvider>
  );
}