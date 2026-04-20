import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Search,
  Star,
  Trash2,
  Pencil,
  UtensilsCrossed,
  ChefHat,
} from "lucide-react-native";
import { colors, radius, spacing } from "../../src/theme";
import {
  deleteProduct,
  getProducts,
  Product,
  updateProduct,
} from "../../src/storage";
import { fmt, maxRations, totalCarbs } from "../../src/calc";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const p = await getProducts();
    setProducts(p);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (onlyFavs && !p.favorite) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
      );
    });
  }, [products, query, onlyFavs]);

  const handleDelete = useCallback(
    (p: Product) => {
      Alert.alert(
        "Eliminar producto",
        `¿Seguro que quieres eliminar "${p.name}" del historial?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async () => {
              await deleteProduct(p.id);
              load();
            },
          },
        ]
      );
    },
    [load]
  );

  const handleEdit = useCallback(
    (p: Product) => {
      router.push({ pathname: "/", params: { id: p.id } });
    },
    [router]
  );

  const handleToggleFav = useCallback(
    async (p: Product) => {
      await updateProduct(p.id, { favorite: !p.favorite });
      load();
    },
    [load]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title} testID="history-title">
          Historial
        </Text>
        <Text style={styles.subtitle}>
          {products.length}{" "}
          {products.length === 1 ? "producto guardado" : "productos guardados"}
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <Search color={colors.textSecondary} size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, marca o categoría..."
          placeholderTextColor={colors.textDisabled}
          value={query}
          onChangeText={setQuery}
          testID="search-input"
        />
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !onlyFavs && styles.filterChipActive]}
          onPress={() => setOnlyFavs(false)}
          testID="filter-all"
        >
          <Text
            style={[styles.filterText, !onlyFavs && styles.filterTextActive]}
          >
            Todos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, onlyFavs && styles.filterChipActive]}
          onPress={() => setOnlyFavs(true)}
          testID="filter-favorites"
        >
          <Star
            size={14}
            color={onlyFavs ? "#fff" : colors.primary}
            fill={onlyFavs ? "#fff" : "transparent"}
          />
          <Text style={[styles.filterText, onlyFavs && styles.filterTextActive]}>
            Favoritos
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty} testID="empty-state">
            <UtensilsCrossed color={colors.textDisabled} size={56} />
            <Text style={styles.emptyTitle}>
              {products.length === 0
                ? "Aún no hay productos"
                : "No se encontraron resultados"}
            </Text>
            <Text style={styles.emptyText}>
              {products.length === 0
                ? 'Ve a "Calcular" y guarda tu primer producto.'
                : "Prueba con otras palabras."}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <HistoryCard
            product={item}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
            onToggleFav={() => handleToggleFav(item)}
          />
        )}
      />
    </View>
  );
}

function HistoryCard({
  product,
  onEdit,
  onDelete,
  onToggleFav,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFav: () => void;
}) {
  const total = totalCarbs(product.totalWeight, product.carbsPer100g);
  const rations = maxRations(product.totalWeight, product.carbsPer100g);
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onEdit}
      activeOpacity={0.7}
      testID={`history-item-${product.id}`}
    >
      <View style={styles.cardImageWrap}>
        {product.photo ? (
          <Image source={{ uri: product.photo }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <UtensilsCrossed color={colors.primary} size={22} />
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {product.name}
          </Text>
          {product.favorite && (
            <Star color={colors.primary} size={14} fill={colors.primary} />
          )}
          {product.cookingEnabled && (
            <View style={styles.cookBadge}>
              <ChefHat color={colors.success} size={11} />
              <Text style={styles.cookBadgeText}>
                x{fmt(product.cookingFactor || 0, 2)}
              </Text>
            </View>
          )}
        </View>
        {(product.brand || product.category) && (
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {[product.brand, product.category].filter(Boolean).join(" · ")}
          </Text>
        )}
        <View style={styles.cardMetaRow}>
          <Text style={styles.metaPrimary}>{fmt(total, 1)}g HC</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaSecondary}>
            {fmt(rations, 2)} raciones
          </Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaSecondary}>
            {fmt(product.totalWeight, 0)}g
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={onToggleFav}
          style={styles.actionBtn}
          testID={`fav-btn-${product.id}`}
          hitSlop={8}
        >
          <Star
            color={product.favorite ? colors.primary : colors.textSecondary}
            size={20}
            fill={product.favorite ? colors.primary : "transparent"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onEdit}
          style={styles.actionBtn}
          testID={`edit-btn-${product.id}`}
          hitSlop={8}
        >
          <Pencil color={colors.textSecondary} size={18} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={styles.actionBtn}
          testID={`delete-btn-${product.id}`}
          hitSlop={8}
        >
          <Trash2 color={colors.error} size={18} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  header: { marginBottom: spacing.lg },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 52,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "500",
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 13,
  },
  filterTextActive: { color: "#fff" },
  listContent: { paddingVertical: spacing.md, paddingBottom: 80 },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 10,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: spacing.md,
  },
  cardImageWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.primarySoft,
  },
  cardImage: { width: "100%", height: "100%" },
  cardImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    flexShrink: 1,
  },
  cookBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(16,185,129,0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  cookBadgeText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "800",
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    flexWrap: "wrap",
  },
  metaPrimary: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 13,
  },
  metaSecondary: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  metaDot: { color: colors.textDisabled, marginHorizontal: 6 },
  cardActions: { flexDirection: "row", gap: 4, alignItems: "center" },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
