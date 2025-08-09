import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import Purchases, { CUSTOMER_INFO_UPDATE_LISTENER } from 'react-native-purchases';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const RC_API_KEY = (Platform.OS === 'ios') ? process.env.EXPO_PUBLIC_RC_IOS_KEY : process.env.EXPO_PUBLIC_RC_ANDROID_KEY;

export default function App() {
  const [userId, setUserId] = useState<string>('');
  const [entitled, setEntitled] = useState<boolean>(false);

  useEffect(() => {
    // Configure RevenueCat
    if (RC_API_KEY) Purchases.configure({ apiKey: RC_API_KEY, appUserID: userId || undefined });
    const sub = Purchases.addCustomerInfoUpdateListener(async (info) => {
      const hasPremium = !!info.entitlements.active?.premium;
      setEntitled(hasPremium);
    }) as unknown as CUSTOMER_INFO_UPDATE_LISTENER;
    return () => {
      try { Purchases.removeCustomerInfoUpdateListener(sub); } catch {}
    };
  }, [userId]);

  const login = async () => {
    // Minimal placeholder: you’ll swap with real auth screen later
    const id = 'demo-user';
    setUserId(id);
    if (RC_API_KEY) await Purchases.logIn(id);
  };

  const purchase = async () => {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages[0];
    if (pkg) await Purchases.purchasePackage(pkg);
  };

  const restore = async () => {
    await Purchases.restorePurchases();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI2 Mobile</Text>
      <Text>API: {API_URL}</Text>
      <Text>Entitled: {entitled ? 'Yes' : 'No'}</Text>
      <View style={{ height: 12 }} />
      <Button title="Login" onPress={login} />
      <View style={{ height: 8 }} />
      <Button title="Purchase" onPress={purchase} />
      <View style={{ height: 8 }} />
      <Button title="Restore" onPress={restore} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
});


