import { useContext } from 'react';
import VibesContext from './vibesContext.js';

export function useVibes() {
  const ctx = useContext(VibesContext);
  if (!ctx) throw new Error('useVibes must be used within a VibesProvider');
  return ctx;
}
