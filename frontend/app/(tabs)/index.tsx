import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Star,
  Save,
  AlertTriangle,
  X,
  Check,
  ChefHat,
  Sparkles,
} from "lucide-react-native";
import { colors, radius, spacing } from "../../src/theme";
import {
  addProduct,
  getProductById,
  updateProduct,
} from "../../src/storage";
import { confirmAction, notify, choose } from "../../src/dialog";
import {
  totalCarbs,
  maxRations,
  gramsNeededForRations,
  cookedGrams,
  fmt,
  GRAMS_PER_RATION,
  MAX_RATIONS,
} from "../../src/calc";

const CATEGORIES = [
  "Cereales",
  "Legumbres",
  "Pan",
  "Pasta",
  "Fruta",
  "Lácteos",
  "Dulces",
  "Otros",
];

const COOKING_PRESETS: { label: string; factor: number }[] = [
  { label: "Arroz x3", factor: 3 },
  { label: "Quinoa x2,5", factor: 2.5 },
  { label: "Pasta x2,5", factor: 2.5 },
  { label: "Legumbres x2,5", factor: 2.5 },
  { label: "Avena x2", factor: 2 },
];

const RATIONS = Array.from({ length: MAX_RATIONS }, (_, i) => i + 1);

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const consumedIdRef = useRef<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<string>("");
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [carbsStr, setCarbsStr] = useState("");
  const [weightStr, setWeightStr] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [cookingEnabled, setCookingEnabled] = useState(false);
  const [factorStr, setFactorStr] = useState("3");
  const [rations, setRations] = useState(1);

  // Load product when navigating with ?id=
  useEffect(() => {
    const id = typeof params.id === "string" ? params.id : "";
    if (!id || id === consumedIdRef.current) return;
    consumedIdRef.current = id;
    (async () => {
      const p = await getProductById(id);
      if (p) {
        setEditingId(p.id);
        setName(p.name);
        setBrand(p.brand || "");
        setCategory(p.category || "");
        setPhoto(p.photo);
        setCarbsStr(String(p.carbsPer100g).replace(".", ","));
        setWeightStr(String(p.totalWeight).replace(".", ","));
        setFavorite(p.favorite);
        setCookingEnabled(!!p.cookingEnabled);
        if (p.cookingFactor) {
          setFactorStr(String(p.cookingFactor).replace(".", ","));
        }
      }
    })();
  }, [params.id]);

  const carbs = useMemo(
    () => parseFloat((carbsStr || "0").replace(",", ".")) || 0,
    [carbsStr]
  );
  const weight = useMemo(
    () => parseFloat((weightStr || "0").replace(",", ".")) || 0,
    [weightStr]
  );
  const factor = useMemo(
    () => parseFloat((factorStr || "0").replace(",", ".")) || 0,
    [factorStr]
  );

  const totalC = useMemo(() => totalCarbs(weight, carbs), [weight, carbs]);
  const maxR = useMemo(() => maxRations(weight, carbs), [weight, carbs]);
  const dryGramsNeeded = useMemo(
    () => gramsNeededForRations(rations, carbs),
    [rations, carbs]
  );
  const cookedGramsNeeded = useMemo(
    () => cookedGrams(dryGramsNeeded, factor),
    [dryGramsNeeded, factor]
  );

  const canCompute = carbs > 0 && weight > 0;
  const insufficient = canCompute && dryGramsNeeded > weight;
  const extraNeeded = insufficient ? dryGramsNeeded - weight : 0;
  const extraBotes = weight > 0 ? extraNeeded / weight : 0;

  const hasAnyData =
    !!name.trim() ||
    !!brand.trim() ||
    !!category ||
    !!photo ||
    !!carbsStr ||
    !!weightStr ||
    favorite ||
    cookingEnabled ||
    !!editingId;

  const resetForm = useCallback(() => {
    setEditingId(null);
    setName("");
    setBrand("");
    setCategory("");
    setPhoto(undefined);
    setCarbsStr("");
    setWeightStr("");
    setFavorite(false);
    setCookingEnabled(false);
    setFactorStr("3");
    setRations(1);
    consumedIdRef.current = null;
  }, []);

  const handleClose = useCallback(async () => {
    if (!hasAnyData) return;
    const ok = await confirmAction(
      "¿Cancelar?",
      "Se descartarán los datos que no hayas guardado.",
      "Descartar",
      true
    );
    if (ok) resetForm();
  }, [hasAnyData, resetForm]);

  const pickPhoto = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        notify(
          "Permiso requerido",
          "Necesitamos acceso a tus fotos para añadir imagen del producto."
        );
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        base64: true,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!res.canceled && res.assets[0]?.base64) {
        setPhoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
      }
    } catch (e) {
      notify("Error", "No se pudo cargar la imagen.");
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        notify(
          "Permiso requerido",
          "Necesitamos acceso a la cámara para tomar foto del producto."
        );
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.5,
        base64: true,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!res.canceled && res.assets[0]?.base64) {
        setPhoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
      }
    } catch (e) {
      notify("Error", "No se pudo tomar la foto.");
    }
  }, []);

  const handlePhotoOptions = useCallback(async () => {
    const choice = await choose(
      "Añadir foto",
      "¿De dónde quieres obtener la foto?",
      [
        { label: "Cámara", value: "camera" },
        { label: "Galería", value: "gallery" },
      ]
    );
    if (choice === "camera") takePhoto();
    else if (choice === "gallery") pickPhoto();
  }, [pickPhoto, takePhoto]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      notify("Falta el nombre", "Por favor, escribe el nombre del producto.");
      return;
    }
    if (!canCompute) {
      notify(
        "Datos incompletos",
        "Introduce los hidratos y el peso total para guardar."
      );
      return;
    }
    try {
      const payload = {
        name: name.trim(),
        brand: brand.trim() || undefined,
        category: category || undefined,
        photo,
        carbsPer100g: carbs,
        totalWeight: weight,
        favorite,
        cookingEnabled,
        cookingFactor: cookingEnabled ? factor : undefined,
      };
      const wasEditing = !!editingId;
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await addProduct(payload);
      }
      // Reset BEFORE notify so Alert.alert on web (no callback support) still resets.
      resetForm();
      notify(
        wasEditing ? "Actualizado" : "Guardado",
        wasEditing
          ? "El producto se ha actualizado en el historial."
          : "El producto se ha añadido al historial."
      );
    } catch (e) {
      notify("Error", "No se pudo guardar el producto.");
    }
  }, [
    editingId,
    name,
    brand,
    category,
    photo,
    carbs,
    weight,
    favorite,
    cookingEnabled,
    factor,
    canCompute,
    resetForm,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 16, paddingBottom: 120 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.flex}>
              <Text style={styles.screenTitle} testID="screen-title">
                {editingId ? "Editar producto" : "Calcular"}
              </Text>
              <Text style={styles.screenSubtitle}>
                1 ración = {GRAMS_PER_RATION}g de hidratos
              </Text>
            </View>
            {hasAnyData && (
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                testID="close-form-btn"
                activeOpacity={0.7}
              >
                <X color={colors.textPrimary} size={22} />
              </TouchableOpacity>
            )}
          </View>

          {/* Photo + Favorite */}
          <View style={styles.photoRow}>
            <TouchableOpacity
              style={styles.photoBox}
              onPress={handlePhotoOptions}
              testID="photo-picker-button"
              activeOpacity={0.7}
            >
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photoImg} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Camera color={colors.primary} size={28} />
                  <Text style={styles.photoText}>Añadir foto</Text>
                </View>
              )}
              {photo && (
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => setPhoto(undefined)}
                  testID="photo-remove-btn"
                >
                  <X color="#fff" size={16} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.favBtn, favorite && styles.favBtnActive]}
              onPress={() => setFavorite((v) => !v)}
              testID="favorite-toggle-btn"
              activeOpacity={0.8}
            >
              <Star
                color={favorite ? "#fff" : colors.primary}
                size={22}
                fill={favorite ? "#fff" : "transparent"}
              />
              <Text
                style={[
                  styles.favBtnText,
                  favorite && styles.favBtnTextActive,
                ]}
              >
                {favorite ? "Favorito" : "Marcar favorito"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name */}
          <Field label="Nombre del producto">
            <TextInput
              style={styles.input}
              placeholder="Ej: Quinoa"
              placeholderTextColor={colors.textDisabled}
              value={name}
              onChangeText={setName}
              testID="input-name"
            />
          </Field>

          {/* Brand */}
          <Field label="Marca (opcional)">
            <TextInput
              style={styles.input}
              placeholder="Ej: Hacendado"
              placeholderTextColor={colors.textDisabled}
              value={brand}
              onChangeText={setBrand}
              testID="input-brand"
            />
          </Field>

          {/* Category */}
          <Field label="Categoría (opcional)">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, category === c && styles.chipActive]}
                  onPress={() =>
                    setCategory((prev) => (prev === c ? "" : c))
                  }
                  testID={`category-chip-${c}`}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === c && styles.chipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Field>

          {/* Numeric inputs */}
          <View style={styles.rowTwo}>
            <View style={styles.flex}>
              <Field label="HC por 100g">
                <TextInput
                  style={styles.input}
                  placeholder="24"
                  placeholderTextColor={colors.textDisabled}
                  value={carbsStr}
                  onChangeText={setCarbsStr}
                  keyboardType="decimal-pad"
                  testID="input-carbs-per-100g"
                />
              </Field>
            </View>
            <View style={{ width: spacing.md }} />
            <View style={styles.flex}>
              <Field label="Peso total (g)">
                <TextInput
                  style={styles.input}
                  placeholder="125"
                  placeholderTextColor={colors.textDisabled}
                  value={weightStr}
                  onChangeText={setWeightStr}
                  keyboardType="decimal-pad"
                  testID="input-total-weight"
                />
              </Field>
            </View>
          </View>

          {/* Cooking toggle */}
          <View style={styles.cookingCard}>
            <View style={styles.cookingRow}>
              <View style={styles.cookingIconWrap}>
                <ChefHat color={colors.primary} size={22} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.cookingTitle}>Cocinar con agua</Text>
                <Text style={styles.cookingSub}>
                  Ajusta el peso al cocinar (arroz, pasta, legumbres...)
                </Text>
              </View>
              <Switch
                value={cookingEnabled}
                onValueChange={setCookingEnabled}
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                thumbColor="#fff"
                ios_backgroundColor={colors.border}
                testID="cooking-toggle"
              />
            </View>

            {cookingEnabled && (
              <View style={styles.cookingContent}>
                <Text style={styles.fieldLabel}>Factor de cocción</Text>
                <View style={styles.factorRow}>
                  <TextInput
                    style={[styles.input, styles.factorInput]}
                    placeholder="3"
                    placeholderTextColor={colors.textDisabled}
                    value={factorStr}
                    onChangeText={setFactorStr}
                    keyboardType="decimal-pad"
                    testID="input-cooking-factor"
                  />
                  <Text style={styles.factorX}>×</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetRow}
                >
                  {COOKING_PRESETS.map((p) => (
                    <TouchableOpacity
                      key={p.label}
                      style={styles.presetChip}
                      onPress={() =>
                        setFactorStr(String(p.factor).replace(".", ","))
                      }
                      testID={`preset-${p.factor}`}
                    >
                      <Sparkles color={colors.primary} size={12} />
                      <Text style={styles.presetText}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Result card */}
          <View style={styles.resultCard} testID="result-card">
            <Text style={styles.resultLabel}>HIDRATOS TOTALES</Text>
            <View style={styles.resultValueRow}>
              <Text style={styles.resultValue} testID="result-total-carbs">
                {canCompute ? fmt(totalC, 1) : "–"}
              </Text>
              <Text style={styles.resultUnit}>g</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.resultLabel}>RACIONES POSIBLES</Text>
            <View style={styles.resultValueRow}>
              <Text
                style={[styles.resultValue, { color: colors.primary }]}
                testID="result-max-rations"
              >
                {canCompute ? fmt(maxR, 2) : "–"}
              </Text>
              <Text style={styles.resultUnit}>raciones</Text>
            </View>
          </View>

          {/* Rations selector - horizontal scroll */}
          <Text style={styles.sectionTitle}>¿Cuántas raciones quieres?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rationRow}
          >
            {RATIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.rationBtn,
                  rations === r && styles.rationBtnActive,
                ]}
                onPress={() => setRations(r)}
                testID={`ration-selector-btn-${r}`}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.rationBtnText,
                    rations === r && styles.rationBtnTextActive,
                  ]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Grams needed for selected rations */}
          <View style={styles.gramsCard} testID="grams-needed-card">
            <Text style={styles.gramsLabel}>
              Para {rations} {rations === 1 ? "ración" : "raciones"} necesitas
              comer
            </Text>
            <View style={styles.resultValueRow}>
              <Text style={styles.gramsValue} testID="grams-needed-value">
                {canCompute ? fmt(dryGramsNeeded, 1) : "–"}
              </Text>
              <Text style={styles.resultUnit}>
                {cookingEnabled ? "g en seco" : "g de producto"}
              </Text>
            </View>

            {cookingEnabled && canCompute && factor > 0 && (
              <View style={styles.cookedRow} testID="cooked-grams-row">
                <ChefHat color={colors.success} size={18} />
                <Text style={styles.cookedLabel}>Cocinado (~x{fmt(factor, 2)}):</Text>
                <Text
                  style={styles.cookedValue}
                  testID="cooked-grams-value"
                >
                  {fmt(cookedGramsNeeded, 1)}g
                </Text>
              </View>
            )}

            <Text style={styles.gramsSub}>
              ({rations * GRAMS_PER_RATION}g de hidratos de carbono)
            </Text>
          </View>

          {/* Warning */}
          {insufficient && (
            <View
              style={styles.warningCard}
              testID="warning-message-insufficient-product"
            >
              <AlertTriangle color={colors.error} size={22} />
              <View style={styles.flex}>
                <Text style={styles.warningTitle}>
                  No hay producto suficiente
                </Text>
                <Text style={styles.warningText}>
                  Con este producto ({fmt(weight, 1)}g) no puedes llegar a{" "}
                  {rations} raciones. Necesitas {fmt(dryGramsNeeded, 1)}g en
                  seco, te faltan{" "}
                  <Text style={styles.warningBold}>
                    {fmt(extraNeeded, 1)}g
                  </Text>{" "}
                  (aprox.{" "}
                  <Text style={styles.warningBold}>
                    {fmt(extraBotes, 2)}
                  </Text>{" "}
                  productos extra).
                </Text>
              </View>
            </View>
          )}

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, !canCompute && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canCompute}
            testID="save-product-btn"
            activeOpacity={0.85}
          >
            {editingId ? (
              <Check color="#fff" size={22} />
            ) : (
              <Save color="#fff" size={22} />
            )}
            <Text style={styles.saveBtnText}>
              {editingId ? "Actualizar" : "Guardar en historial"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  photoBox: {
    width: 104,
    height: 104,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700",
  },
  photoImg: { width: "100%", height: "100%" },
  photoRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  favBtn: {
    flex: 1,
    flexDirection: "row",
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  favBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  favBtnText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  favBtnTextActive: { color: "#fff" },
  field: { marginBottom: spacing.lg },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  input: {
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "500",
  },
  rowTwo: { flexDirection: "row" },
  categoryRow: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { color: colors.textSecondary, fontWeight: "600", fontSize: 14 },
  chipTextActive: { color: "#fff" },

  // Cooking
  cookingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cookingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cookingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cookingTitle: {
    color: colors.textPrimary,
    fontWeight: "800",
    fontSize: 16,
  },
  cookingSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  cookingContent: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  factorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  factorInput: {
    flex: 1,
  },
  factorX: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    minWidth: 32,
    textAlign: "center",
  },
  presetRow: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    marginRight: spacing.sm,
  },
  presetText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },

  // Result
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  resultLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  resultValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  resultValue: {
    fontSize: 48,
    fontWeight: "900",
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  resultUnit: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "700",
    marginLeft: 6,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  rationRow: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingRight: spacing.sm,
  },
  rationBtn: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  rationBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rationBtnText: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: "800",
  },
  rationBtnTextActive: { color: "#fff" },
  gramsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gramsLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  gramsValue: {
    fontSize: 44,
    fontWeight: "900",
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  cookedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cookedLabel: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  cookedValue: {
    color: colors.success,
    fontWeight: "900",
    fontSize: 22,
    marginLeft: "auto",
  },
  gramsSub: {
    color: colors.textDisabled,
    fontSize: 12,
    marginTop: spacing.sm,
    fontWeight: "500",
  },
  warningCard: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  warningTitle: {
    color: colors.error,
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 4,
  },
  warningText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  warningBold: {
    fontWeight: "800",
    color: colors.error,
  },
  saveBtn: {
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  saveBtnDisabled: {
    backgroundColor: colors.borderStrong,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
  },
});
