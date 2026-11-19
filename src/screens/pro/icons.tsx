// Portal web — íconos simples dibujados con View (sin librerías extra)
import React from 'react';
import { View } from 'react-native';

type P = { color: string };

export function IconPanel({ color }: P) {
  const b = { borderWidth: 1.5, borderColor: color, borderRadius: 1.5 };
  return (
    <View style={{ width: 15, height: 15, flexDirection: 'row', gap: 2 }}>
      <View style={[b, { flex: 1 }]}/>
      <View style={{ flex: 1, gap: 2 }}><View style={[b, { flex: 1 }]}/><View style={[b, { flex: 1 }]}/></View>
    </View>
  );
}

export function IconUsuarios({ color }: P) {
  return (
    <View style={{ width: 16, height: 15, alignItems: 'center' }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: color }}/>
      <View style={{ width: 13, height: 6, marginTop: 1.5, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderWidth: 1.5, borderBottomWidth: 0, borderColor: color }}/>
    </View>
  );
}

export function IconPlanes({ color }: P) {
  return (
    <View style={{ width: 12, height: 15, borderWidth: 1.5, borderColor: color, borderRadius: 2, paddingHorizontal: 2, justifyContent: 'center', gap: 2 }}>
      <View style={{ height: 1.5, backgroundColor: color }}/>
      <View style={{ height: 1.5, backgroundColor: color }}/>
      <View style={{ height: 1.5, width: '60%', backgroundColor: color }}/>
    </View>
  );
}

export function IconReportes({ color }: P) {
  return (
    <View style={{ width: 15, height: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 2.5 }}>
      {[5, 9, 14].map(h => <View key={h} style={{ width: 3, height: h, backgroundColor: color, borderRadius: 1 }}/>)}
    </View>
  );
}

export function IconBuscar({ color }: P) {
  return (
    <View style={{ width: 13, height: 13 }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: color }}/>
      <View style={{ position: 'absolute', right: 0.5, bottom: 1.5, width: 5, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }] }}/>
    </View>
  );
}

export function IconCampana({ color }: P) {
  return (
    <View style={{ width: 14, height: 15, alignItems: 'center' }}>
      <View style={{ width: 11, height: 10, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderWidth: 1.5, borderBottomWidth: 0, borderColor: color }}/>
      <View style={{ width: 14, height: 1.5, backgroundColor: color }}/>
      <View style={{ width: 4, height: 2.5, marginTop: 1, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: color }}/>
    </View>
  );
}
