//logica de las vistas
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Switch, TextInput, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { C, styles } from '../constants/theme';
import type { Screen, ProScreen } from '../types';
import { Title, Card, Button, Brand, Ring, Macro, Setting, Stat, MobileHeader, MobileNav } from '../components';
import { FoodRepository } from '../services/foodRepository';
import { AuthService, type DatosRegistro } from '../services/authService';
import { ConsumoService, ExpedienteService, PlanService } from '../services/firestoreService';
import type { Alimento } from '../types/food';
import type { UserProfile, ConsumoDiario, ExpedientePaciente, MetaNutricional, PlanNutricional } from '../types/models';

const meals = [['DESAYUNO','650 kcal','Avena con proteína...']] as const;
const proNav: [ProScreen,string][] = [['pro-dashboard','PANEL PRINCIPAL'],['users','USUARIOS'],['plans','PLANES'],['reports','REPORTES']];

/** Props comunes de las pantallas del portal profesional */
type ProProps = { go: (s: Screen) => void; profesionalUid: string; nombre: string };

/** Texto de error / éxito con los colores del tema */
function Aviso({ text, ok = false }: { text: string; ok?: boolean }) {
  if (!text) return null;
  return <Text style={{ color: ok ? C.lime : C.red, fontWeight: '800', fontSize: 12 }}>{text}</Text>;
}

// ══════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════
export function Login({ onLogin, goRegister }: { onLogin: (p: UserProfile) => void; goRegister: () => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError('Ingresa tu correo y contraseña.'); return; }
    setLoading(true); setError('');
    try {
      onLogin(await AuthService.login(email.trim(), password));
    } catch (e: any) {
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') setError('Credenciales incorrectas.');
      else if (e.code === 'auth/user-not-found') setError('No existe una cuenta con este correo.');
      else if (e.code === 'auth/too-many-requests') setError('Demasiados intentos. Espera unos minutos.');
      else setError(e.message ?? 'Error al iniciar sesión.');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.welcome}>
      <View style={styles.welcomeGlow}/>
      <Brand/>
      <Text style={styles.welcomeTitle}>TU NUTRICIÓN,{`\n`}EN MOVIMIENTO.</Text>
      <Card style={{ alignSelf: 'stretch' }}>
        <Text style={styles.cardLabel}>CORREO ELECTRÓNICO</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="tu@email.com" placeholderTextColor={C.dim} keyboardType="email-address" autoCapitalize="none" style={styles.input}/>
        <Text style={styles.cardLabel}>CONTRASEÑA</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={C.dim} secureTextEntry style={styles.input}/>
        <Aviso text={error}/>
        <Button label={loading ? 'INICIANDO SESIÓN...' : 'ENTRAR'} onPress={handleLogin}/>
      </Card>
      <Pressable onPress={goRegister}><Text style={styles.proLink}>¿NO TIENES CUENTA? REGISTRARSE</Text></Pressable>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// REGISTER
// ══════════════════════════════════════════════════════════════════════════
export function Register({ onRegistered, goLogin }: { onRegistered: (p: UserProfile) => void; goLogin: () => void }) {
  const [rol, setRol]           = useState<'PACIENTE' | 'PROFESIONAL'>('PACIENTE');
  const [nombre, setNombre]     = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [rut, setRut]           = useState('');
  const [codigo, setCodigo]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleRegister = async () => {
    setError('');
    if (!nombre.trim() || !email.trim() || !password.trim()) { setError('Completa todos los campos obligatorios.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (rol === 'PROFESIONAL') {
      if (!rut.trim()) { setError('Ingresa tu RUT.'); return; }
      if (!/^\d{6}$/.test(codigo.trim())) { setError('El código identificador debe tener exactamente 6 dígitos.'); return; }
    }
    setLoading(true);
    try {
      const datos: DatosRegistro = rol === 'PROFESIONAL'
        ? { nombre: nombre.trim(), rol, rut: rut.trim(), codigoIdentificador: codigo.trim() }
        : { nombre: nombre.trim(), rol };
      onRegistered(await AuthService.register(email.trim(), password, datos));
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') setError('Ya existe una cuenta con este correo.');
      else if (e.code === 'auth/invalid-email') setError('El correo no es válido.');
      else setError(e.message ?? 'Error al crear la cuenta.');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.mobileContent}>
      <Brand/>
      <Title dark>CREAR CUENTA</Title>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {(['PACIENTE', 'PROFESIONAL'] as const).map(r => (
          <Pressable key={r} onPress={() => setRol(r)} style={[styles.button, { flex: 1 }, rol !== r && styles.buttonGhost]}>
            <Text style={[styles.buttonText, rol !== r && { color: C.white }]}>{r === 'PACIENTE' ? 'PACIENTE' : 'NUTRICIONISTA'}</Text>
          </Pressable>
        ))}
      </View>
      <Card>
        <Text style={styles.cardLabel}>NOMBRE COMPLETO</Text>
        <TextInput value={nombre} onChangeText={setNombre} placeholder="Tu nombre" placeholderTextColor={C.dim} style={styles.input}/>
        <Text style={styles.cardLabel}>CORREO ELECTRÓNICO</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="tu@email.com" placeholderTextColor={C.dim} keyboardType="email-address" autoCapitalize="none" style={styles.input}/>
        <Text style={styles.cardLabel}>CONTRASEÑA</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor={C.dim} secureTextEntry style={styles.input}/>
        <Text style={styles.cardLabel}>CONFIRMAR CONTRASEÑA</Text>
        <TextInput value={confirm} onChangeText={setConfirm} placeholder="Repite tu contraseña" placeholderTextColor={C.dim} secureTextEntry style={styles.input}/>
        {rol === 'PROFESIONAL' && (
          <>
            <Text style={styles.cardLabel}>RUT</Text>
            <TextInput value={rut} onChangeText={setRut} placeholder="12.345.678-9" placeholderTextColor={C.dim} style={styles.input}/>
            <Text style={styles.cardLabel}>CÓDIGO IDENTIFICADOR (6 DÍGITOS)</Text>
            <TextInput value={codigo} onChangeText={t => setCodigo(t.replace(/\D/g, '').slice(0, 6))} placeholder="123456" placeholderTextColor={C.dim} keyboardType="numeric" maxLength={6} style={styles.input}/>
          </>
        )}
        <Aviso text={error}/>
        <Button label={loading ? 'CREANDO CUENTA...' : 'REGISTRARME'} onPress={handleRegister}/>
      </Card>
      {rol === 'PACIENTE' && (
        <Card>
          <Text style={styles.cardLabel}>IMPORTANTE</Text>
          <Text style={styles.body}>Tu cuenta quedará pendiente hasta que un nutricionista te agregue como su paciente.</Text>
        </Card>
      )}
      <Pressable onPress={goLogin} style={{ alignItems: 'center' }}><Text style={styles.proLink}>¿YA TIENES CUENTA? INICIAR SESIÓN</Text></Pressable>
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PENDING
// ══════════════════════════════════════════════════════════════════════════
export function Pending({ nombre, onLogout }: { nombre: string; onLogout: () => Promise<void> }) {
  return (
    <View style={styles.welcome}>
      <View style={styles.welcomeGlow}/>
      <Brand/>
      <Text style={styles.welcomeTitle}>CUENTA{`\n`}PENDIENTE.</Text>
      <Text style={styles.lead}>
        Hola {nombre.split(' ')[0]}, tu cuenta fue creada. Para usar Nutrap, un nutricionista debe agregarte como su paciente.
      </Text>
      <Text style={styles.lead}>Esta pantalla se actualizará sola en cuanto te asocie.</Text>
      <Button label="CERRAR SESIÓN" onPress={onLogout} ghost/>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// APP MÓVIL — PACIENTE
// ══════════════════════════════════════════════════════════════════════════
export function Welcome({go}:{go:(s:Screen)=>void}) { return <View style={styles.welcome}><View style={styles.welcomeGlow}/><Brand/><Text style={styles.welcomeTitle}>TU NUTRICIÓN,{`\n`}EN MOVIMIENTO.</Text><Text style={styles.lead}>Seguimiento de macros, escáner de alimentos y hábitos que se sostienen.</Text><Button label="COMENZAR" onPress={()=>go('dashboard')}/><Pressable onPress={()=>go('pro-dashboard')}><Text style={styles.proLink}>ACCESO PROFESIONAL</Text></Pressable></View>; }

const pct = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

export function Dashboard({ go, uid, nombre, meta }: { go: (s: Screen) => void; uid: string; nombre: string; meta?: MetaNutricional }) {
  const [consumo, setConsumo] = useState<ConsumoDiario | null>(null);
  const [loading, setLoading] = useState(true);

  const metaKcal = meta?.caloriasObjetivo ?? 2000;
  const metaProt = meta?.proteinaObjetivo ?? 150;
  const metaCarb = meta?.carbohidratosObjetivo ?? 200;
  const metaGras = meta?.grasasObjetivo ?? 67;

  const cargar = useCallback(async () => {
    setLoading(true);
    try { setConsumo(await ConsumoService.getHoy(uid)); } finally { setLoading(false); }
  }, [uid]);
  useEffect(() => { cargar(); }, [cargar]);

  const kcal = consumo?.totalCalorias ?? 0;
  const prot = consumo?.totalProteina ?? 0;
  const carb = consumo?.totalCarbohidratos ?? 0;
  const gras = consumo?.totalGrasas ?? 0;
  const ultimo = consumo?.registros[consumo.registros.length - 1];

  return (
    <>
      <MobileHeader onProfile={()=>go('profile')} onSettings={()=>go('settings')}/>
      <ScrollView contentContainerStyle={styles.mobileContent}>
        <Text style={styles.eyebrow}>HOY</Text>
        <Title dark>BUEN DÍA, {nombre.split(' ')[0].toUpperCase()}</Title>
        {loading ? <ActivityIndicator color={C.lime}/> : (
          <>
            <View style={styles.rings}><Ring value={kcal} label="kcal"/><Ring value={Math.max(0, metaKcal - kcal)} label="RESTANTES"/></View>
            <Title>MACROS</Title>
            <Macro label="PROTEÍNA" now={`${prot}`} goal={`${metaProt}g`} percent={pct(prot, metaProt)}/>
            <Macro label="CARBS" now={`${carb}`} goal={`${metaCarb}g`} percent={pct(carb, metaCarb)}/>
            <Macro label="FATS" now={`${gras}`} goal={`${metaGras}g`} percent={pct(gras, metaGras)}/>
            <Card>
              <Text style={styles.cardLabel}>ÚLTIMO REGISTRO</Text>
              <Text style={styles.cardTitle}>{ultimo ? `${ultimo.nombre.toUpperCase()} · ${ultimo.calorias} KCAL` : 'SIN REGISTROS HOY'}</Text>
              <Text style={styles.body}>{ultimo ? `P: ${ultimo.proteina}g | C: ${ultimo.carbohidratos}g | G: ${ultimo.grasas}g` : 'Usa el scanner para registrar tu primera comida del día.'}</Text>
            </Card>
          </>
        )}
      </ScrollView>
      <MobileNav screen="dashboard" setScreen={go}/>
    </>
  );
}

export function Scanner({ go, uid }: { go: (s: Screen) => void; uid: string }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>(Platform.OS === 'web' ? 'manual' : 'camera');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState<Alimento | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const registrar = async (code: string) => {
    setLoading(true);
    setErrorMsg('');
    const alimento = await FoodRepository.getByBarcode(code);
    if (alimento) {
      try {
        await ConsumoService.agregarAlimento(uid, {
          id: `${alimento.id}_${Date.now()}`, nombre: alimento.nombre, calorias: alimento.calorias,
          proteina: alimento.proteina, carbohidratos: alimento.carbohidratos, grasas: alimento.grasas,
          fuente: alimento.fuente, timestamp: Date.now(),
        });
        setLastScanned(alimento);
      } catch (e: any) {
        setErrorMsg('No se pudo guardar el registro: ' + (e.message ?? ''));
      }
    } else {
      setErrorMsg(`Producto no encontrado en Open Food Facts (código: ${code}).`);
    }
    setLoading(false);
  };

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    const code = result.data?.trim();
    if (!code || scanned || loading) return;
    setScanned(true);
    setBarcodeInput(code);
    await registrar(code);
  };

  const handleManualSearch = async () => {
    if (!barcodeInput.trim()) return;
    await registrar(barcodeInput.trim());
    setScanned(true);
  };

  const resetScan = () => { setScanned(false); setErrorMsg(''); setBarcodeInput(''); };

  return (
    <>
      <MobileHeader onProfile={()=>go('profile')} onSettings={()=>go('settings')}/>
      <ScrollView contentContainerStyle={styles.mobileContent}>
        <Title dark>SCANNER DE ALIMENTOS</Title>
        <View style={{flexDirection:'row', gap:10}}>
          <Pressable onPress={()=>{ setScanMode('camera'); resetScan(); }} style={[styles.button, {flex:1}, scanMode !== 'camera' && styles.buttonGhost]}>
            <Text style={[styles.buttonText, scanMode !== 'camera' && {color:C.white}]}>📷 CÁMARA</Text>
          </Pressable>
          <Pressable onPress={()=>setScanMode('manual')} style={[styles.button, {flex:1}, scanMode !== 'manual' && styles.buttonGhost]}>
            <Text style={[styles.buttonText, scanMode !== 'manual' && {color:C.white}]}>⌨️ MANUAL</Text>
          </Pressable>
        </View>

        {scanMode === 'camera' ? (
          !permission ? (
            <Card style={[styles.viewfinder, {justifyContent:'center', alignItems:'center'}]}>
              <Text style={styles.viewfinderText}>CARGANDO CÁMARA...</Text>
            </Card>
          ) : !permission.granted ? (
            <Card style={[styles.viewfinder, {padding:24, justifyContent:'center', alignItems:'center', gap:14}]}>
              <Text style={[styles.cardTitle, {textAlign:'center'}]}>PERMISO DE CÁMARA REQUERIDO</Text>
              <Text style={[styles.body, {textAlign:'center'}]}>Para escanear códigos de barras de alimentos directamente, autoriza el uso de la cámara.</Text>
              <Button label="CONCEDER PERMISO" onPress={requestPermission}/>
            </Card>
          ) : (
            <Card style={[styles.viewfinder, {padding:0, overflow:'hidden', position:'relative'}]}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torch}
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }}
                onBarcodeScanned={scanned || loading ? undefined : handleBarcodeScanned}
              />
              <View style={styles.target} pointerEvents="none"/>
              <Pressable onPress={()=>setTorch(t => !t)} style={{ position:'absolute', top:12, right:12, backgroundColor: torch ? C.lime : 'rgba(0,0,0,0.65)', paddingHorizontal:12, paddingVertical:6, borderRadius:20 }}>
                <Text style={{color: torch ? '#000' : C.white, fontSize:10, fontWeight:'900', letterSpacing:1}}>{torch ? '🔦 LUZ ON' : '💡 LUZ OFF'}</Text>
              </Pressable>
              {loading && (
                <View style={[StyleSheet.absoluteFill, {backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'center', alignItems:'center', padding:20}]}>
                  <Text style={{color:C.lime, fontWeight:'900', fontSize:13, letterSpacing:1}}>CONSULTANDO API...</Text>
                </View>
              )}
              {scanned && !loading && (
                <View style={[StyleSheet.absoluteFill, {backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'center', alignItems:'center', padding:20, gap:12}]}>
                  <Text style={{color:C.lime, fontWeight:'900', fontSize:14, letterSpacing:1}}>✓ CÓDIGO CAPTURADO</Text>
                  <Text style={{color:C.white, fontSize:12, fontWeight:'700'}}>{barcodeInput}</Text>
                  <Button label="ESCANEAR OTRO" onPress={resetScan}/>
                </View>
              )}
            </Card>
          )
        ) : (
          <Card>
            <Text style={styles.cardLabel}>CÓDIGO DE BARRAS O NÚMERO (EAN / UPC)</Text>
            <TextInput value={barcodeInput} onChangeText={setBarcodeInput} placeholder="Ej: 7801610001053 o 5449000000996" placeholderTextColor={C.dim} keyboardType="numeric" style={styles.input}/>
            <View style={{height:10}}/>
            <Button label={loading ? 'CONSULTANDO API...' : 'BUSCAR ALIMENTO (API)'} onPress={handleManualSearch}/>
          </Card>
        )}

        {errorMsg !== '' && (
          <Card style={{borderColor:C.red, backgroundColor:'#2b1a1a', gap:8}}>
            <Text style={{color:C.red, fontWeight:'800', fontSize:12}}>{errorMsg}</Text>
            {scanned && <Button label="REINTENTAR ESCANEO" onPress={resetScan} ghost/>}
          </Card>
        )}

        <Title>ÚLTIMO PRODUCTO REGISTRADO</Title>
        <Card>
          <Text style={styles.cardTitle}>{lastScanned ? lastScanned.nombre : 'NINGUNO TODAVÍA'}</Text>
          <Text style={styles.body}>
            {lastScanned
              ? `${lastScanned.calorias} KCAL | P: ${lastScanned.proteina}g | C: ${lastScanned.carbohidratos}g | G: ${lastScanned.grasas}g (Vía ${lastScanned.fuente})`
              : 'Apunta la cámara a un código de barras para registrar calorías y macros.'}
          </Text>
        </Card>
      </ScrollView>
      <MobileNav screen="scanner" setScreen={go}/>
    </>
  );
}

export function Calendar({go}:{go:(s:Screen)=>void}) { return <><MobileHeader onProfile={()=>go('profile')} onSettings={()=>go('settings')}/><ScrollView contentContainerStyle={styles.mobileContent}><Title dark>CALENDARIO</Title><View style={styles.week}>{['LUN 13','MAR 14','MIÉ 15','JUE 16','VIE 17','SÁB 18','DOM 19'].map((d,i)=><View key={d} style={[styles.day,i===2&&styles.dayActive]}><Text style={styles.dayText}>{d}</Text></View>)}</View><Title>CONSUMO DIARIO</Title><Card><Text style={styles.cardLabel}>ÚLTIMOS 7 DÍAS · META: 2200 KCAL</Text><View style={styles.chart}>{[70,88,75,92,80,60,85].map((h,i)=><View key={i} style={[styles.chartBar,{height:h}]} />)}</View></Card><Title>RESUMEN MENSUAL</Title><View style={styles.statGrid}><Stat label="PROMEDIO DIARIO" value="1,950 kcal"/><Stat label="DÍAS EN META" value="18/30"/><Stat label="MEJOR RACHA" value="7 días"/></View></ScrollView><MobileNav screen="calendar" setScreen={go}/></>; }

export function Profile({ go, user }: { go: (s: Screen) => void; user: UserProfile }) {
  const initials = user.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const m = user.meta;
  return (
    <>
      <MobileHeader onProfile={()=>go('profile')} onSettings={()=>go('settings')}/>
      <ScrollView contentContainerStyle={styles.mobileContent}>
        <Card style={{alignItems:'center'}}>
          <View style={[styles.avatar,styles.avatarLarge]}><Text style={styles.avatarText}>{initials}</Text></View>
          <Title dark>{user.nombre.toUpperCase()}</Title>
          <Text style={styles.body}>{user.email}</Text>
        </Card>
        <Title>MI META DIARIA</Title>
        <Card>
          <Text style={styles.bigNumber}>{m ? `${m.caloriasObjetivo} KCAL` : 'SIN PLAN ASIGNADO'}</Text>
          <Text style={styles.body}>{m ? 'Definida por tu nutricionista.' : 'Tu nutricionista aún no te asigna un plan.'}</Text>
        </Card>
        <Title>MACROS OBJETIVO</Title>
        <View style={styles.statGrid}>
          <Stat label="PROTEÍNA" value={m ? `${m.proteinaObjetivo} g` : '—'}/>
          <Stat label="CARBOHIDRATOS" value={m ? `${m.carbohidratosObjetivo} g` : '—'}/>
          <Stat label="GRASAS" value={m ? `${m.grasasObjetivo} g` : '—'}/>
        </View>
        <Button label="EDITAR PERFIL" onPress={()=>go('settings')} ghost/>
      </ScrollView>
      <MobileNav screen="profile" setScreen={go}/>
    </>
  );
}

export function Settings({ go, onLogout }: { go: (s: Screen) => void; onLogout: () => Promise<void> }) {
  const [dark,setDark]=useState(true),[push,setPush]=useState(true);
  return <><MobileHeader onProfile={()=>go('profile')} onSettings={()=>go('settings')}/><ScrollView contentContainerStyle={styles.mobileContent}><Title dark>CONFIGURACIÓN</Title><Text style={styles.cardLabel}>APARIENCIA</Text><Setting label="MODO OSCURO / CLARO" right={<Switch value={dark} onValueChange={setDark} trackColor={{true:C.lime}}/>}/><Text style={styles.cardLabel}>PREFERENCIAS</Text><Setting label="NOTIFICACIONES PUSH" right={<Switch value={push} onValueChange={setPush} trackColor={{true:C.lime}}/>}/><Setting label="UNIDADES DE MEDIDA" value="MÉTRICO (KG)"/><Setting label="IDIOMA" value="Español"/><Card><Text style={styles.cardTitle}>NUTRITRACK PRO</Text><Text style={styles.body}>v2.4.1{`\n\n`}Desarrollado bajo estándares urbanos industriales de alto rendimiento.</Text></Card><Button label="CERRAR SESIÓN" onPress={onLogout} ghost/></ScrollView><MobileNav screen="settings" setScreen={go}/></>;
}

// ══════════════════════════════════════════════════════════════════════════
// PORTAL PROFESIONAL
// ══════════════════════════════════════════════════════════════════════════
export function ProShell({screen,go,nombre,children}:{screen:ProScreen;go:(s:Screen)=>void;nombre:string;children:React.ReactNode}) {
  return (
    <View style={styles.pro}>
      <View style={styles.sidebar}>
        <View><Brand/>{proNav.map(([id,label])=><Pressable key={id} onPress={()=>go(id)} style={[styles.sideItem,screen===id&&styles.sideActive]}><Text style={[styles.sideText,screen===id&&styles.sideTextActive]}>{label}</Text></Pressable>)}</View>
        <Card>
          <Text style={styles.cardTitle}>{nombre}</Text>
          <Text style={styles.cardLabel}>NUTRICIONISTA</Text>
          <Button label="CERRAR SESIÓN" onPress={()=>AuthService.logout()} ghost/>
        </Card>
      </View>
      <View style={styles.proMain}>
        <View style={styles.topbar}><Text style={styles.topbarText}>{proNav.find(x=>x[0]===screen)?.[1]}</Text><TextInput placeholder="Buscar paciente, plan, reporte..." placeholderTextColor={C.dim} style={styles.search}/></View>
        <ScrollView contentContainerStyle={styles.proContent}>{children}</ScrollView>
      </View>
    </View>
  );
}

export function ProDashboard({ go, profesionalUid, nombre }: ProProps) {
  const [pacientes, setPacientes] = useState<ExpedientePaciente[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { ExpedienteService.getPorProfesional(profesionalUid).then(d => { setPacientes(d); setLoading(false); }); }, [profesionalUid]);

  const enAlerta = pacientes.filter(p => p.estado === 'Riesgo' || p.estado === 'Crítico' || p.estado === 'Intervención Requerida').length;
  const adherencia = pacientes.length ? (pacientes.reduce((s, p) => s + p.adherencia, 0) / pacientes.length).toFixed(1) : '0';

  return (
    <ProShell screen="pro-dashboard" go={go} nombre={nombre}>
      <Title>VISTA GENERAL</Title>
      <Text style={styles.body}>Control operativo de la cohorte activa.</Text>
      {loading ? <ActivityIndicator color={C.lime}/> : (
        <View style={styles.proGrid}><Stat label="PACIENTES ACTIVOS" value={String(pacientes.length)}/><Stat label="ADHERENCIA PROMEDIO" value={`${adherencia}%`}/><Stat label="PLANES EN ALERTA" value={String(enAlerta)}/></View>
      )}
      <Card><Title dark>TENDENCIAS DE ADHERENCIA</Title><View style={styles.chart}>{[45,62,55,80,70,92,84,96].map((h,i)=><View key={i} style={[styles.chartBar,{height:h}]} />)}</View></Card>
      <Card>
        <Title dark>PACIENTES RECIENTES</Title>
        {pacientes.slice(0, 5).map(p => <Text key={p.uid} style={styles.listLine}>{p.nombre} · {p.estado} · {p.caloriasObjetivo} kcal</Text>)}
        {!loading && pacientes.length === 0 && <Text style={styles.listLine}>Aún no tienes pacientes. Agrégalos desde USUARIOS.</Text>}
      </Card>
    </ProShell>
  );
}

export function Users({ go, profesionalUid, nombre }: ProProps) {
  const [pacientes, setPacientes] = useState<ExpedientePaciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [encontrado, setEncontrado] = useState<UserProfile | null>(null);
  const [aviso, setAviso] = useState<{ text: string; ok: boolean }>({ text: '', ok: false });
  const [asociando, setAsociando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setPacientes(await ExpedienteService.getPorProfesional(profesionalUid));
    setLoading(false);
  }, [profesionalUid]);
  useEffect(() => { cargar(); }, [cargar]);

  const buscar = async () => {
    if (!email.trim()) return;
    setBuscando(true); setEncontrado(null); setAviso({ text: '', ok: false });
    try {
      const p = await ExpedienteService.buscarPacientePorEmail(email.trim());
      if (!p) setAviso({ text: 'No se encontró ningún paciente con ese correo.', ok: false });
      else if (p.profesionalUid === profesionalUid) setAviso({ text: 'Este paciente ya está en tu lista.', ok: false });
      else if (p.profesionalUid) setAviso({ text: 'Este paciente ya está asociado a otro nutricionista.', ok: false });
      else setEncontrado(p);
    } catch (e: any) {
      setAviso({ text: 'Error en la búsqueda: ' + (e.message ?? ''), ok: false });
    } finally { setBuscando(false); }
  };

  const asociar = async () => {
    if (!encontrado) return;
    setAsociando(true);
    try {
      await ExpedienteService.asociarPaciente(profesionalUid, encontrado);
      setAviso({ text: `✓ ${encontrado.nombre} fue agregado a tus pacientes.`, ok: true });
      setEncontrado(null); setEmail('');
      await cargar();
    } catch (e: any) {
      setAviso({ text: 'Error al asociar: ' + (e.message ?? ''), ok: false });
    } finally { setAsociando(false); }
  };

  const altoRiesgo = pacientes.filter(p => p.estado === 'Riesgo' || p.estado === 'Crítico' || p.estado === 'Intervención Requerida').length;

  return (
    <ProShell screen="users" go={go} nombre={nombre}>
      <View style={styles.row}>
        <View><Title>DIRECTORIO DE PACIENTES</Title><Text style={styles.body}>Consulte, filtre y gestione todos los expedientes activos.</Text></View>
        <Button label="+ NUEVO PROTOCOLO" onPress={()=>go('plans')}/>
      </View>
      <Card>
        <Title dark>AGREGAR PACIENTE</Title>
        <Text style={styles.body}>Busca al paciente por el correo con que se registró en Nutrap.</Text>
        <View style={styles.row}>
          <TextInput value={email} onChangeText={t => { setEmail(t); setEncontrado(null); setAviso({ text: '', ok: false }); }} placeholder="paciente@email.com" placeholderTextColor={C.dim} keyboardType="email-address" autoCapitalize="none" style={[styles.input, styles.flex]}/>
          <Button label={buscando ? 'BUSCANDO...' : 'BUSCAR'} onPress={buscar}/>
        </View>
        {encontrado && (
          <View style={styles.meal}>
            <View style={styles.row}>
              <View><Text style={styles.cardTitle}>{encontrado.nombre}</Text><Text style={styles.body}>{encontrado.email} · Pendiente de asociación</Text></View>
              <Button label={asociando ? 'ASOCIANDO...' : 'ASOCIAR COMO MI PACIENTE'} onPress={asociar}/>
            </View>
          </View>
        )}
        <Aviso text={aviso.text} ok={aviso.ok}/>
      </Card>
      <View style={styles.proGrid}><Stat label="TOTAL ACTIVOS" value={String(pacientes.length)}/><Stat label="ALTO RIESGO" value={String(altoRiesgo)}/></View>
      <Card>
        {loading ? <ActivityIndicator color={C.lime}/> : pacientes.map(p => (
          <View key={p.uid} style={styles.tableRow}>
            <View><Text style={styles.cardTitle}>{p.nombre}</Text><Text style={styles.body}>{p.email}</Text></View>
            <Text style={styles.body}>{p.estado}</Text>
            <Text style={styles.tableValue}>{p.adherencia}%</Text>
          </View>
        ))}
        {!loading && pacientes.length === 0 && <Text style={styles.body}>Aún no tienes pacientes. Usa el buscador para agregar el primero.</Text>}
      </Card>
    </ProShell>
  );
}

// ── Planes ────────────────────────────────────────────────────────────────
const KCAL_POR_GRAMO = { proteina: 4, carbohidratos: 4, grasas: 9 } as const;
const num = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;
const gramos = (kcal: number, porcentaje: number, kcalPorGramo: number) => Math.round((kcal * porcentaje) / 100 / kcalPorGramo);

function MacroInput({ label, descripcion, rango, kcalPorGramo, value, onChange, kcalTotal }: {
  label: string; descripcion: string; rango: string; kcalPorGramo: number;
  value: string; onChange: (v: string) => void; kcalTotal: number;
}) {
  const p = num(value);
  const kcalMacro = Math.round((kcalTotal * p) / 100);
  return (
    <View style={styles.meal}>
      <View style={styles.row}>
        <Text style={styles.mealTitle}>{label}</Text>
        <Text style={styles.cardLabel}>{kcalPorGramo} KCAL POR GRAMO</Text>
      </View>
      <Text style={styles.body}>{descripcion}</Text>
      <Text style={styles.cardLabel}>RANGO HABITUAL: {rango} DE LAS CALORÍAS</Text>
      <View style={styles.fields}>
        <View style={styles.field}>
          <Text style={styles.cardLabel}>PORCENTAJE (%)</Text>
          <TextInput value={value} onChangeText={t => onChange(t.replace(/\D/g, '').slice(0, 3))} keyboardType="numeric" placeholder="0" placeholderTextColor={C.dim} style={styles.input}/>
        </View>
        <View style={styles.field}>
          <Text style={styles.cardLabel}>EQUIVALE A</Text>
          <Text style={styles.statValue}>{gramos(kcalTotal, p, kcalPorGramo)} g · {kcalMacro} kcal</Text>
        </View>
      </View>
    </View>
  );
}

export function Plans({ go, profesionalUid, nombre }: ProProps) {
  const [pacientes, setPacientes] = useState<ExpedientePaciente[]>([]);
  const [planes, setPlanes] = useState<PlanNutricional[]>([]);
  const [loading, setLoading] = useState(true);

  const [seleccionado, setSeleccionado] = useState<ExpedientePaciente | null>(null);
  const [nombrePlan, setNombrePlan] = useState('');
  const [kcal, setKcal] = useState('');
  const [proteina, setProteina] = useState('30');
  const [carbohidratos, setCarbohidratos] = useState('45');
  const [grasas, setGrasas] = useState('25');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ text: string; ok: boolean }>({ text: '', ok: false });

  const cargar = useCallback(async () => {
    setLoading(true);
    const [pac, pla] = await Promise.all([
      ExpedienteService.getPorProfesional(profesionalUid),
      PlanService.getPorProfesional(profesionalUid),
    ]);
    setPacientes(pac); setPlanes(pla); setLoading(false);
  }, [profesionalUid]);
  useEffect(() => { cargar(); }, [cargar]);

  const kcalTotal = num(kcal);
  const pP = num(proteina), pC = num(carbohidratos), pG = num(grasas);
  const suma = pP + pC + pG;

  const asignar = async () => {
    if (!seleccionado) { setAviso({ text: 'Selecciona un paciente.', ok: false }); return; }
    if (kcalTotal < 800 || kcalTotal > 6000) { setAviso({ text: 'Las calorías totales deben estar entre 800 y 6000 kcal.', ok: false }); return; }
    if (suma !== 100) { setAviso({ text: `Los porcentajes deben sumar 100% (ahora suman ${suma}%).`, ok: false }); return; }
    setGuardando(true); setAviso({ text: '', ok: false });
    try {
      await PlanService.asignar({
        nombre: nombrePlan.trim() || `PLAN ${seleccionado.nombre.toUpperCase()}`,
        pacienteUid: seleccionado.uid,
        pacienteNombre: seleccionado.nombre,
        profesionalUid,
        calorias: kcalTotal,
        proteinaPct: pP, carbohidratosPct: pC, grasasPct: pG,
        proteinaG:      gramos(kcalTotal, pP, KCAL_POR_GRAMO.proteina),
        carbohidratosG: gramos(kcalTotal, pC, KCAL_POR_GRAMO.carbohidratos),
        grasasG:        gramos(kcalTotal, pG, KCAL_POR_GRAMO.grasas),
      });
      setAviso({ text: `✓ Plan asignado a ${seleccionado.nombre}.`, ok: true });
      setNombrePlan(''); setKcal('');
      await cargar();
    } catch (e: any) {
      setAviso({ text: 'Error al asignar el plan: ' + (e.message ?? ''), ok: false });
    } finally { setGuardando(false); }
  };

  const activos = planes.filter(p => p.activo);

  return (
    <ProShell screen="plans" go={go} nombre={nombre}>
      <View style={styles.row}>
        <View><Title>GESTIÓN DE PLANES ALIMENTICIOS</Title><Text style={styles.body}>Creación y asignación de pautas nutricionales personalizadas.</Text></View>
        <Button label={guardando ? 'ASIGNANDO...' : 'ASIGNAR A PACIENTE'} onPress={asignar}/>
      </View>
      <Aviso text={aviso.text} ok={aviso.ok}/>

      {/* 1 · Paciente */}
      <Card>
        <Title dark>1 · SELECCIONAR PACIENTE</Title>
        {loading ? <ActivityIndicator color={C.lime}/> : pacientes.length === 0 ? (
          <Text style={styles.body}>Aún no tienes pacientes asociados. Agrégalos desde USUARIOS.</Text>
        ) : pacientes.map(p => {
          const activo = seleccionado?.uid === p.uid;
          return (
            <Pressable key={p.uid} onPress={() => setSeleccionado(p)} style={[styles.tableRow, activo && { borderColor: C.lime }]}>
              <View><Text style={[styles.cardTitle, activo && { color: C.lime }]}>{p.nombre}</Text><Text style={styles.body}>{p.email}</Text></View>
              <Text style={styles.body}>{p.planActivoId ? `Plan actual: ${p.caloriasObjetivo} kcal` : 'Sin plan'}</Text>
              <Text style={styles.tableValue}>{activo ? 'SELECCIONADO' : 'ELEGIR'}</Text>
            </Pressable>
          );
        })}
      </Card>

      {/* 2 · Calorías */}
      <Card>
        <Title dark>2 · CALORÍAS TOTALES</Title>
        <Text style={styles.body}>Energía total que el paciente debe consumir al día. Las macros se calculan a partir de este número.</Text>
        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.cardLabel}>PACIENTE</Text>
            <Text style={styles.statValue}>{seleccionado ? seleccionado.nombre : '—'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.cardLabel}>NOMBRE DEL PLAN (OPCIONAL)</Text>
            <TextInput value={nombrePlan} onChangeText={setNombrePlan} placeholder="Ej: PROTOCOLO HIPERTROFIA V2" placeholderTextColor={C.dim} style={styles.input}/>
          </View>
          <View style={styles.field}>
            <Text style={styles.cardLabel}>CALORÍAS OBJETIVO (KCAL)</Text>
            <TextInput value={kcal} onChangeText={t => setKcal(t.replace(/\D/g, '').slice(0, 4))} keyboardType="numeric" placeholder="2800" placeholderTextColor={C.dim} style={styles.input}/>
          </View>
        </View>
      </Card>

      <View style={styles.split}>
        {/* 3 · Macros */}
        <Card style={styles.flex}>
          <Title dark>3 · DISTRIBUCIÓN DE MACROS</Title>
          <Text style={styles.body}>
            Los macronutrientes son los tres nutrientes que aportan energía. Indica qué porcentaje de las calorías totales vendrá de cada uno; deben sumar 100%.
          </Text>
          <MacroInput
            label="PROTEÍNA" kcalPorGramo={KCAL_POR_GRAMO.proteina} rango="10–35%"
            descripcion="Construye y repara músculos y tejidos; forma enzimas y hormonas. Clave en planes de hipertrofia o recuperación. Ej: carnes, huevo, legumbres, lácteos."
            value={proteina} onChange={setProteina} kcalTotal={kcalTotal}
          />
          <MacroInput
            label="CARBOHIDRATOS" kcalPorGramo={KCAL_POR_GRAMO.carbohidratos} rango="45–65%"
            descripcion="Principal fuente de energía del cuerpo, sobre todo del cerebro y durante el ejercicio. Ej: arroz, avena, pan, frutas, papas."
            value={carbohidratos} onChange={setCarbohidratos} kcalTotal={kcalTotal}
          />
          <MacroInput
            label="GRASAS" kcalPorGramo={KCAL_POR_GRAMO.grasas} rango="20–35%"
            descripcion="Energía concentrada; necesarias para producir hormonas y absorber las vitaminas A, D, E y K. Ej: aceite de oliva, palta, frutos secos."
            value={grasas} onChange={setGrasas} kcalTotal={kcalTotal}
          />
          <Macro label="TOTAL DISTRIBUIDO" now={`${suma}%`} goal="100%" percent={Math.min(100, suma)}/>
          {suma !== 100 && <Aviso text={suma > 100 ? `Sobran ${suma - 100}% — ajusta los valores.` : `Faltan ${100 - suma}% por distribuir.`}/>}
        </Card>

        {/* Planes activos */}
        <Card style={styles.activePlans}>
          <Title dark>PLANES ACTIVOS</Title>
          {activos.length === 0 && !loading && <Text style={styles.body}>Aún no has asignado planes.</Text>}
          {activos.map(p => (
            <View key={p.id} style={styles.meal}>
              <Text style={styles.mealTitle}>{p.nombre.toUpperCase()}</Text>
              <Text style={styles.body}>Asignado a {p.pacienteNombre} · {p.calorias} kcal</Text>
              <Text style={styles.body}>P {p.proteinaPct}% ({p.proteinaG}g) · C {p.carbohidratosPct}% ({p.carbohidratosG}g) · G {p.grasasPct}% ({p.grasasG}g)</Text>
            </View>
          ))}
        </Card>
      </View>

      <Card>
        <View style={styles.row}><Title dark>CONSTRUCTOR DE DIETAS</Title><Button label="AÑADIR" onPress={()=>{}}/></View>
        {meals.map(m=><View key={m[0]} style={styles.meal}><View style={styles.row}><Text style={styles.mealTitle}>{m[0]}</Text><Text style={styles.body}>{m[1]}</Text></View><Text style={styles.body}>{m[2]}</Text></View>)}
      </Card>
    </ProShell>
  );
}

export function Reports({ go, nombre }: ProProps) { return <ProShell screen="reports" go={go} nombre={nombre}><View style={styles.row}><View><Title>ANALÍTICAS DEL SISTEMA</Title><Text style={styles.body}>Estadísticas consolidadas de adherencia y deficiencias.</Text></View><Button label="GENERAR PDF SEMANAL" onPress={()=>{}}/></View><Card><Title dark>TENDENCIAS DE ADHERENCIA DE LA COHORTE</Title><View style={styles.chart}>{[55,63,70,72,78,83,85,91].map((h,i)=><View key={i} style={[styles.chartBar,{height:h}]} />)}</View></Card><View style={styles.proGrid}><Stat label="PACIENTES ACTIVOS" value="1,492"/><Stat label="CUMPLIMIENTO PROTOCOLO" value="84.5%"/></View><Card><Title dark>DEFICIENCIAS COMUNES EN COHORTE</Title>{[['Vitamina D3','68%'],['Magnesio','45%'],['Omega 3','32%']].map(([n,v])=><Macro key={n} label={n.toUpperCase()} now={v} goal="" percent={parseInt(v)}/>)}</Card></ProShell>; }
