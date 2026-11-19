// App móvil — scanner de alimentos
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { C } from '../../constants/theme';
import type { Screen } from '../../types';
import type { UserProfile } from '../../types/models';
import { FoodRepository } from '../../services/foodRepository';
import { ConsumoService } from '../../services/firestoreService';
import { m, Header, BottomNav } from './ui';
import { useConsumoHoy } from './useConsumoHoy';

const s = StyleSheet.create({
  camara:   { height: 340, borderRadius: 12, overflow: 'hidden', backgroundColor: '#101010', alignItems: 'center', justifyContent: 'center' },
  pill:     { position: 'absolute', top: 14, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  pillText: { color: C.white, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  marco:    { width: 230, height: 140 },
  esquina:  { position: 'absolute', width: 26, height: 26, borderColor: C.lime },
  linea:    { position: 'absolute', left: 14, right: 14, top: 69, height: 2, backgroundColor: C.lime },
  linterna: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  overlay:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  manual:   { alignSelf: 'center', width: '80%', marginTop: -36, backgroundColor: C.white, borderRadius: 24, paddingVertical: 13, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  manualTx: { color: '#111', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
});

function MarcoEscaneo() {
  return (
    <View style={s.marco} pointerEvents="none">
      <View style={[s.esquina, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 }]}/>
      <View style={[s.esquina, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 }]}/>
      <View style={[s.esquina, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 }]}/>
      <View style={[s.esquina, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 }]}/>
      <View style={s.linea}/>
    </View>
  );
}

export function Scanner({ go, user }: { go: (s: Screen) => void; user: UserProfile }) {
  const [permission, requestPermission] = useCameraPermissions();
  const consumo = useConsumoHoy(user.uid);
  const sinCamara = Platform.OS === 'web';

  const [torch, setTorch]       = useState(false);
  const [scanned, setScanned]   = useState(false);
  const [manual, setManual]     = useState(sinCamara);
  const [codigo, setCodigo]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [mensaje, setMensaje]   = useState<{ text: string; ok: boolean } | null>(null);

  const registrar = async (code: string) => {
    setLoading(true);
    setMensaje(null);
    try {
      const a = await FoodRepository.getByBarcode(code);
      if (!a) { setMensaje({ text: `Producto no encontrado en Open Food Facts (código: ${code}).`, ok: false }); return; }
      await ConsumoService.agregarAlimento(user.uid, {
        id: `${a.id}_${Date.now()}`, nombre: a.nombre, calorias: a.calorias,
        proteina: a.proteina, carbohidratos: a.carbohidratos, grasas: a.grasas,
        fuente: a.fuente, timestamp: Date.now(),
      });
      setMensaje({ text: `✓ ${a.nombre} · ${a.calorias} KCAL registrado.`, ok: true });
      setCodigo('');
    } catch (e: any) {
      setMensaje({ text: 'No se pudo registrar: ' + (e.message ?? ''), ok: false });
    } finally {
      setLoading(false);
    }
  };

  const onBarcode = async (r: BarcodeScanningResult) => {
    const code = r.data?.trim();
    if (!code || scanned || loading) return;
    setScanned(true);
    await registrar(code);
  };

  const recientes = [...(consumo?.registros ?? [])].reverse().slice(0, 6);

  const vistaCamara = () => {
    if (sinCamara) return <Text style={m.muted}>La cámara no está disponible aquí. Usa el ingreso manual.</Text>;
    if (!permission) return <ActivityIndicator color={C.lime}/>;
    if (!permission.granted) {
      return (
        <View style={{ alignItems: 'center', gap: 12, padding: 24 }}>
          <Text style={[m.label, { textAlign: 'center' }]}>PERMISO DE CÁMARA REQUERIDO</Text>
          <Text style={[m.muted, { textAlign: 'center' }]}>Autoriza la cámara para escanear códigos de barras.</Text>
          <Pressable onPress={requestPermission} style={[m.btnLime, { paddingHorizontal: 20 }]}><Text style={m.btnLimeText}>CONCEDER PERMISO</Text></Pressable>
        </View>
      );
    }
    return (
      <>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }}
          onBarcodeScanned={scanned || loading ? undefined : onBarcode}
        />
        <View style={s.pill}><Text style={s.pillText}>ENCUADRA EL CÓDIGO DE BARRAS</Text></View>
        <MarcoEscaneo/>
        <Pressable onPress={() => setTorch(t => !t)} style={[s.linterna, { backgroundColor: torch ? C.lime : 'rgba(0,0,0,0.6)' }]}>
          <Text style={{ color: torch ? '#000' : C.white, fontSize: 9, fontWeight: '900' }}>{torch ? 'LUZ ON' : 'LUZ OFF'}</Text>
        </Pressable>
        {(loading || scanned) && (
          <View style={s.overlay}>
            {loading
              ? <><ActivityIndicator color={C.lime}/><Text style={m.valueLime}>CONSULTANDO...</Text></>
              : <Pressable onPress={() => { setScanned(false); setMensaje(null); }} style={[m.btnLime, { paddingHorizontal: 24 }]}><Text style={m.btnLimeText}>ESCANEAR OTRO</Text></Pressable>}
          </View>
        )}
      </>
    );
  };

  return (
    <View style={m.screen}>
      <Header user={user} go={go}/>
      <ScrollView contentContainerStyle={m.content}>
        <View style={s.camara}>{vistaCamara()}</View>

        <Pressable onPress={() => setManual(v => !v)} style={s.manual}>
          <Text style={{ color: '#111', fontSize: 14 }}>{'⌨︎'}</Text>
          <Text style={s.manualTx}>{manual ? 'OCULTAR INGRESO MANUAL' : 'INGRESO MANUAL'}</Text>
        </Pressable>

        {manual && (
          <View style={m.card}>
            <Text style={m.label}>CÓDIGO DE BARRAS (EAN / UPC)</Text>
            <TextInput value={codigo} onChangeText={setCodigo} placeholder="Ej: 7801610001053" placeholderTextColor={C.dim} keyboardType="numeric"
              style={{ color: C.white, backgroundColor: C.panel2, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 }}/>
            <Pressable onPress={() => codigo.trim() && registrar(codigo.trim())} style={m.btnLime}>
              <Text style={m.btnLimeText}>{loading ? 'CONSULTANDO...' : 'BUSCAR Y REGISTRAR'}</Text>
            </Pressable>
          </View>
        )}

        {mensaje && <Text style={{ color: mensaje.ok ? C.lime : C.red, fontSize: 12, fontWeight: '800' }}>{mensaje.text}</Text>}

        <Text style={m.section}>ESCANEOS RECIENTES</Text>
        {recientes.length === 0 && <Text style={m.dim}>Aún no registras alimentos hoy.</Text>}
        {recientes.map(r => (
          <View key={r.id} style={[m.card, m.row]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={m.label} numberOfLines={1}>{r.nombre.toUpperCase()}</Text>
              <Text style={m.dim}>P {r.proteina}g · C {r.carbohidratos}g · G {r.grasas}g</Text>
            </View>
            <Text style={[m.valueLime, { fontSize: 14 }]}>{r.calorias} KCAL</Text>
          </View>
        ))}
      </ScrollView>
      <BottomNav active="scanner" go={go}/>
    </View>
  );
}
