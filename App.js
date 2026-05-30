import { useEffect } from 'react';
import { initDatabase } from './src/database/db';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    initDatabase();
  }, []);

  return <AppNavigator />;
}