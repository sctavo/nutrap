import React, { useMemo, useState } from 'react';
import { StatusBar, useWindowDimensions, View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { styles } from './src/constants/theme';
import type { Screen, ProScreen } from './src/types';
import { Welcome, Dashboard, Scanner, Calendar, Profile, Settings, ProDashboard, Users, Plans, Reports } from './src/screens';

export default function App() { 
  const {width} = useWindowDimensions(); 
  const [screen, setScreen] = useState<Screen>(width >= 900 ? 'pro-dashboard' : 'welcome'); 
  const [consumed, setConsumed] = useState(2200); 
  
  const isPro = (s: Screen): s is ProScreen => s.startsWith('pro') || s === 'users' || s === 'plans' || s === 'reports'; 
  const go = (s: Screen) => setScreen(s); 
  
  const content = useMemo(() => { 
    if(isPro(screen)){ 
      if(screen === 'users') return <Users go={go}/>; 
      if(screen === 'plans') return <Plans go={go}/>; 
      if(screen === 'reports') return <Reports go={go}/>; 
      return <ProDashboard go={go}/>; 
    } 
    switch(screen){
      case 'dashboard': return <Dashboard go={go} consumed={consumed}/>;
      case 'scanner': return <Scanner go={go} onScan={() => setConsumed(v => Math.min(2200, v + 120))}/>;
      case 'calendar': return <Calendar go={go}/>;
      case 'settings': return <Settings go={go}/>;
      case 'profile': return <Profile go={go}/>;
      default: return <Welcome go={go}/>;
    } 
  }, [screen, consumed]); 
  
  return (
    <View style={styles.app}>
      <StatusBar barStyle="light-content"/>
      {content}
      <ExpoStatusBar style="light"/>
    </View>
  ); 
}