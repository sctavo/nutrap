// Portal web — reportes (aún con datos de ejemplo)
import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../../constants/theme';
import { Title, Card, Button, Macro, Stat } from '../../components';
import type { ProProps } from '../shared';
import { ProShell } from './ProShell';

export function Reports({ go, nombre }: ProProps) { return <ProShell screen="reports" go={go} nombre={nombre}><View style={styles.row}><View><Title>ANALÍTICAS DEL SISTEMA</Title><Text style={styles.body}>Estadísticas consolidadas de adherencia y deficiencias.</Text></View><Button label="GENERAR PDF SEMANAL" onPress={()=>{}}/></View><Card><Title dark>TENDENCIAS DE ADHERENCIA DE LA COHORTE</Title><View style={styles.chart}>{[55,63,70,72,78,83,85,91].map((h,i)=><View key={i} style={[styles.chartBar,{height:h}]} />)}</View></Card><View style={styles.proGrid}><Stat label="PACIENTES ACTIVOS" value="1,492"/><Stat label="CUMPLIMIENTO PROTOCOLO" value="84.5%"/></View><Card><Title dark>DEFICIENCIAS COMUNES EN COHORTE</Title>{[['Vitamina D3','68%'],['Magnesio','45%'],['Omega 3','32%']].map(([n,v])=><Macro key={n} label={n.toUpperCase()} now={v} goal="" percent={parseInt(v)}/>)}</Card></ProShell>; }
