//componentes base puros

import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Switch } from 'react-native';
import { C, styles } from '../constants/theme';
import type { Screen } from '../types';

export function Title({ children, dark=false }: {children: React.ReactNode; dark?: boolean}) { return <Text style={[styles.title, dark && {color:C.white}]}>{children}</Text>; }
export function Card({children, style}:{children:React.ReactNode;style?:any}) { return <View style={[styles.card,style]}>{children}</View>; }
export function Button({label,onPress,ghost=false}:{label:string;onPress:()=>void;ghost?:boolean}) { return <Pressable onPress={onPress} style={[styles.button,ghost&&styles.buttonGhost]}><Text style={[styles.buttonText,ghost&&{color:C.white}]}>{label}</Text></Pressable>; }
export function Brand(){ return <Text style={styles.brand}>NUTRAP</Text>; }
export function Ring({value,label}:{value:number;label:string}) { return <View style={styles.ring}><Text style={styles.ringNumber}>{value}</Text><Text style={styles.ringLabel}>{label}</Text></View>; }
export function Macro({label,now,goal,percent}:{label:string;now:string;goal:string;percent:number}) { return <View style={styles.macro}><View style={styles.row}><Text style={styles.macroLabel}>{label}</Text><Text style={styles.macroValue}>{now} / {goal}</Text></View><View style={styles.bar}><View style={[styles.barFill,{width:`${percent}%`}]} /></View></View>; }
export function Setting({label,value,right}:{label:string;value?:string;right?:React.ReactNode}) { return <Card style={styles.setting}><Text style={styles.settingLabel}>{label}</Text>{right??<Text style={styles.settingValue}>{value}</Text>}</Card>; }
export function Stat({label,value}:{label:string;value:string}) { return <Card style={styles.stat}><Text style={styles.cardLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></Card>; }
export function Field({label,value}:{label:string;value:string}) { return <View style={styles.field}><Text style={styles.cardLabel}>{label}</Text><TextInput defaultValue={value} style={styles.input}/></View>; }
export function MobileHeader({onProfile,onSettings}:{onProfile:()=>void;onSettings:()=>void}) { return <View style={styles.mobileHeader}><Brand/><View style={styles.headerRight}><Pressable onPress={onProfile} style={styles.avatar}><Text style={styles.avatarText}>CM</Text></Pressable><Pressable onPress={onSettings} style={styles.settings}><Text style={styles.settingsText}>AJUSTES</Text></Pressable></View></View>; }
export function MobileNav({screen,setScreen}:{screen:Screen;setScreen:(s:Screen)=>void}) { return <View style={styles.mobileNav}>{([['dashboard','DASHBOARD'],['scanner','SCANNER'],['calendar','CALENDARIO']] as const).map(([key,label])=><Pressable key={key} onPress={()=>setScreen(key)} style={styles.mobileNavItem}><Text style={[styles.navText,screen===key&&styles.navActive]}>{label}</Text></Pressable>)}</View>; }