// App móvil — bienvenida (prototipo)
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { styles } from '../../constants/theme';
import type { Screen } from '../../types';
import { Button, Brand } from '../../components';

export function Welcome({go}:{go:(s:Screen)=>void}) { return <View style={styles.welcome}><View style={styles.welcomeGlow}/><Brand/><Text style={styles.welcomeTitle}>TU NUTRICIÓN,{`\n`}EN MOVIMIENTO.</Text><Text style={styles.lead}>Seguimiento de macros, escáner de alimentos y hábitos que se sostienen.</Text><Button label="COMENZAR" onPress={()=>go('dashboard')}/><Pressable onPress={()=>go('pro-dashboard')}><Text style={styles.proLink}>ACCESO PROFESIONAL</Text></Pressable></View>; }
