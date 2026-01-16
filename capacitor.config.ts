import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.appsistente.app',
  appName: 'appsistente',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
