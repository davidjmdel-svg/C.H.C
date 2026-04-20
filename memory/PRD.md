# Diabetes Carb Counter — PRD

## Overview
App móvil (Expo React Native) en español para diabéticos que calcula hidratos de carbono por producto y raciones (1 ración = 10g HC), con soporte opcional de cocción.

## Key Features
- **Pantalla Calcular**: formulario con nombre, marca, categoría, foto, HC/100g, peso total, favorito y toggle "cocinar con agua" con factor (x).
- **Cálculos automáticos**: HC totales = (peso/100) × HC/100g; raciones = HC totales / 10; gramos en seco para N raciones = (N × 10 × 100) / HC/100g; gramos cocinados = gramos en seco × factor.
- **Selector de raciones 1-8** (scroll horizontal) con aviso si el producto no cubre las raciones seleccionadas.
- **Botón X de cerrar/descartar** en el header cuando hay datos en el formulario.
- **Pantalla Historial**: búsqueda por nombre/marca/categoría, filtro "Todos/Favoritos", edición, eliminación y toggle de favoritos por tarjeta.
- **Persistencia local** en AsyncStorage (clave `diabetes_products_v1`).

## Tech
- Expo Router 6 (tabs), React Native 0.81, TypeScript
- lucide-react-native icons, expo-image-picker (cámara/galería con permisos), @react-native-async-storage/async-storage
- Web-safe dialog helper (`/app/frontend/src/dialog.ts`) para manejar confirm/alert en web y Alert en nativo.

## Theme
Lila/púrpura + blanco (healthy). Primary #8B5CF6, fondo #F6F2FA, surface #FFFFFF.

## Integraciones
Sin integraciones 3rd-party. 100% local.
