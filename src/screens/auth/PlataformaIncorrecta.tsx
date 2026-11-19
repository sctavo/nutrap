// Aviso cuando la cuenta no corresponde a esta plataforma
import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../../constants/theme';
import { Button, Brand } from '../../components';
import { ES_WEB } from '../shared';

export function PlataformaIncorrecta({ nombre, onLogout }: { nombre: string; onLogout: () => Promise<void> }) {
  return (
    <View style={styles.welcome}>
      <View style={styles.welcomeGlow}/>
      <Brand/>
      <Text style={styles.welcomeTitle}>{ES_WEB ? `ACCESO DESDE\nLA APP MÓVIL.` : `ACCESO DESDE\nEL PORTAL WEB.`}</Text>
      <Text style={styles.lead}>
        {ES_WEB
          ? `Hola ${nombre.split(' ')[0]}, tu cuenta es de paciente. El portal web es exclusivo para nutricionistas: ingresa desde la app de Nutrap en tu celular.`
          : `Hola ${nombre.split(' ')[0]}, tu cuenta es de nutricionista. La app móvil es exclusiva para pacientes: gestiona a tus pacientes desde el portal web de Nutrap en tu computador.`}
      </Text>
      <Button label="CERRAR SESIÓN" onPress={onLogout} ghost/>
    </View>
  );
}
