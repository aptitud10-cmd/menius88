'use client';

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Upload, X,
  ChevronDown, ChevronUp, Leaf, Sparkles, Wheat, GripVertical,
  ImageIcon,
} from 'lucide-react';
import {
  createProduct, updateProduct, deleteProduct,
  saveProductVariants, saveProductExtras,
} from '@/lib/actions/restaurant';
import { formatPrice, cn } from '@/lib/utils';
import type { Product, Category, ProductVariant, ProductExtra } from '@/types';

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetariano', icon: Leaf, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'vegan', label: 'Vegano', icon: Sparkles, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'gluten-free', label: 'Sin Gluten', icon: Wheat, color: 'text-amber-600 bg-amber-50 border-amber-200' },
];

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  dietary_tags: string[];
  prep_time_minutes: string;
  calories: string;
}

const emptyForm = (defaultCategoryId: string): ProductFormData => ({
  name: '', description: '', price: '', category_id: defaultCategoryId,
  image_url: '', dietary_tags: [], prep_time_minutes: '', calories: '',
});

interface VariantRow { id?: string; name: string; price_delta: number; sort_order: number }
interface ExtraRow { id?: string; name: string; price: number; sort_order: number }

export function ProductsManager({ initialProducts, categories }: { initialProducts: Product[]; categories: Category[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm(categories[0]?.id ?? ''));
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [extras, setExtras] = useState<ExtraRow[]>([]);
  const [expandedSection, setExpandedSection] = useState<'variants' | 'extras' | 'advanced' | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setForm(emptyForm(categories[0]?.id ?? ''));
    setVariants([]);
    setExtras([]);
    setEditingId(null);
    setShowForm(false);
    setError('');
    setExpandedSection(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/tenant/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setForm(prev => ({ ...prev, image_url: result.url }));
    } catch (err: any) {
      setError(err.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('Nombre requerido'); return; }
    if (!form.category_id) { setError('Selecciona una categoría'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { setError('Precio inválido'); return; }

    startTransition(async () => {
      const productData: any = {
        name: form.name,
        description: form.description,
        price,
        category_id: form.category_id,
        is_active: true,
      };

      if (form.image_url) productData.image_url = form.image_url;
      if (form.dietary_tags.length > 0) productData.dietary_tags = form.dietary_tags;
      if (form.prep_time_minutes) productData.prep_time_minutes = parseInt(form.prep_time_minutes);
      if (form.calories) productData.calories = parseInt(form.calories);

      if (editingId) {
        const result = await updateProduct(editingId, productData);
        if (result.error) { setError(result.error); return; }

        // Save variants & extras
        if (variants.length > 0 || editingId) {
          await saveProductVariants(editingId, variants);
        }
        if (extras.length > 0 || editingId) {
          await saveProductExtras(editingId, extras);
        }

        setProducts(prev => prev.map(p =>
          p.id === editingId ? {
            ...p, ...productData,
            variants: variants as any[],
            extras: extras as any[],
          } : p
        ));
      } else {
        const result = await createProduct(productData);
        if (result.error) { setError(result.error); return; }
        // Note: variants/extras need to be added after creation (requires product ID)
        // For now, product is created without them. User can edit to add.
        setProducts(prev => [...prev, {
          id: `temp-${Date.now()}`, restaurant_id: '', category_id: form.category_id,
          name: form.name, description: form.description, price, image_url: form.image_url,
          is_active: true, sort_order: prev.length, created_at: new Date().toISOString(),
          dietary_tags: form.dietary_tags, prep_time_minutes: form.prep_time_minutes ? parseInt(form.prep_time_minutes) : undefined,
          calories: form.calories ? parseInt(form.calories) : undefined,
        }]);
      }
      resetForm();
    });
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      category_id: p.category_id,
      image_url: p.image_url || '',
      dietary_tags: p.dietary_tags ?? [],
      prep_time_minutes: p.prep_time_minutes ? String(p.prep_time_minutes) : '',
      calories: p.calories ? String(p.calories) : '',
    });
    setVariants((p.variants ?? []).map((v, i) => ({
      id: v.id, name: v.name, price_delta: v.price_delta, sort_order: v.sort_order ?? i,
    })));
    setExtras((p.extras ?? []).map((e, i) => ({
      id: e.id, name: e.name, price: Number(e.price), sort_order: e.sort_order ?? i,
    })));
    setShowForm(true);
    setExpandedSection(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    startTransition(async () => {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    });
  };

  const handleToggle = (p: Product) => {
    startTransition(async () => {
      await updateProduct(p.id, { is_active: !p.is_active });
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
    });
  };

  const toggleDietaryTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(t => t !== tag)
        : [...prev.dietary_tags, tag],
    }));
  };

  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name ?? '';

  const filtered = filterCategory === 'all' ? products : products.filter(p => p.category_id === filterCategory);

  return (
    <div>
      {categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">Primero crea una categoría</p>
          <p className="text-sm mt-1">Necesitas al menos una categoría antes de agregar productos</p>
        </div>
      ) : (
        <>
          {/* Top bar */}
          {!showForm && (
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Nuevo producto
              </button>
              {/* Category filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={() => window.open('/api/tenant/menu/export', '_blank')}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  ⬇ Exportar CSV
                </button>
                <label className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                  ⬆ Importar CSV
                  <input type="file" accept=".csv" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    const res = await fetch('/api/tenant/menu/import', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ csvData: text }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      alert(`Importado: ${data.categoriesCreated} categorías, ${data.productsCreated} productos. Recarga la página.`);
                      window.location.reload();
                    } else {
                      alert(`Error: ${data.error}`);
                    }
                    e.target.value = '';
                  }} />
                </label>
                <span className="text-xs text-gray-400">{filtered.length} productos</span>
              </div>
            </div>
          )}

          {/* ===== Product Form ===== */}
          {showForm && (
            <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {editingId ? 'Editar producto' : 'Nuevo producto'}
                </h3>
                <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {error && (
                  <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
                )}

                {/* Image upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Imagen</label>
                  <div className="flex items-center gap-3">
                    {form.image_url ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image src={form.image_url} alt="Preview" fill sizes="80px" className="object-cover" />
                        <button
                          onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 shadow-sm flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {uploading ? 'Subiendo...' : 'Subir imagen'}
                      </button>
                      <p className="text-[10px] text-gray-400 mt-1">JPEG, PNG, WebP. Max 5MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Basic fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Tacos al Pastor"
                      autoFocus
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descripción que verán tus clientes..."
                      rows={2}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Precio *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      min="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Categoría *</label>
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Dietary tags */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Etiquetas</label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map(opt => {
                      const Icon = opt.icon;
                      const selected = form.dietary_tags.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleDietaryTag(opt.value)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                            selected ? opt.color : 'text-gray-400 bg-gray-50 border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ===== Collapsible: Variants ===== */}
                {editingId && (
                  <CollapsibleSection
                    title={`Variantes (${variants.length})`}
                    isOpen={expandedSection === 'variants'}
                    onToggle={() => setExpandedSection(expandedSection === 'variants' ? null : 'variants')}
                  >
                    <div className="space-y-2">
                      {variants.map((v, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[i] = { ...v, name: e.target.value };
                              setVariants(updated);
                            }}
                            placeholder="Ej: Grande"
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={v.price_delta}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[i] = { ...v, price_delta: parseFloat(e.target.value) || 0 };
                              setVariants(updated);
                            }}
                            placeholder="+$0"
                            className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                          <button
                            onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setVariants([...variants, { name: '', price_delta: 0, sort_order: variants.length }])}
                        className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 mt-1"
                      >
                        <Plus className="w-3 h-3" /> Agregar variante
                      </button>
                    </div>
                  </CollapsibleSection>
                )}

                {/* ===== Collapsible: Extras ===== */}
                {editingId && (
                  <CollapsibleSection
                    title={`Extras (${extras.length})`}
                    isOpen={expandedSection === 'extras'}
                    onToggle={() => setExpandedSection(expandedSection === 'extras' ? null : 'extras')}
                  >
                    <div className="space-y-2">
                      {extras.map((ex, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={ex.name}
                            onChange={(e) => {
                              const updated = [...extras];
                              updated[i] = { ...ex, name: e.target.value };
                              setExtras(updated);
                            }}
                            placeholder="Ej: Queso extra"
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={ex.price}
                            onChange={(e) => {
                              const updated = [...extras];
                              updated[i] = { ...ex, price: parseFloat(e.target.value) || 0 };
                              setExtras(updated);
                            }}
                            placeholder="$0"
                            className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                          <button
                            onClick={() => setExtras(extras.filter((_, idx) => idx !== i))}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setExtras([...extras, { name: '', price: 0, sort_order: extras.length }])}
                        className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 mt-1"
                      >
                        <Plus className="w-3 h-3" /> Agregar extra
                      </button>
                    </div>
                  </CollapsibleSection>
                )}

                {/* ===== Collapsible: Advanced ===== */}
                <CollapsibleSection
                  title="Avanzado"
                  isOpen={expandedSection === 'advanced'}
                  onToggle={() => setExpandedSection(expandedSection === 'advanced' ? null : 'advanced')}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tiempo prep. (min)</label>
                      <input
                        type="number"
                        value={form.prep_time_minutes}
                        onChange={(e) => setForm(prev => ({ ...prev, prep_time_minutes: e.target.value }))}
                        placeholder="15"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Calorías (kcal)</label>
                      <input
                        type="number"
                        value={form.calories}
                        onChange={(e) => setForm(prev => ({ ...prev, calories: e.target.value }))}
                        placeholder="450"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    {isPending ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear producto'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== Product List ===== */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="font-medium">Sin productos</p>
              <p className="text-sm mt-1">Agrega productos a tu menú</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(p => (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center gap-3 bg-white rounded-xl border px-4 py-3 transition-all',
                    p.is_active ? 'border-gray-100' : 'border-gray-100 opacity-60'
                  )}
                >
                  {/* Image */}
                  {p.image_url ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image src={p.image_url} alt={p.name} fill sizes="48px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg text-gray-300">{p.name.charAt(0)}</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-medium', !p.is_active && 'line-through text-gray-400')}>
                        {p.name}
                      </span>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        {getCategoryName(p.category_id)}
                      </span>
                      {(p.dietary_tags ?? []).map(tag => {
                        const opt = DIETARY_OPTIONS.find(o => o.value === tag);
                        if (!opt) return null;
                        const Icon = opt.icon;
                        return (
                          <span key={tag} className={cn('inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium', opt.color)}>
                            <Icon className="w-2.5 h-2.5" />
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-brand-600">{formatPrice(Number(p.price))}</span>
                      {(p.variants?.length ?? 0) > 0 && (
                        <span className="text-[10px] text-gray-400">{p.variants?.length} variantes</span>
                      )}
                      {(p.extras?.length ?? 0) > 0 && (
                        <span className="text-[10px] text-gray-400">{p.extras?.length} extras</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggle(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                      {p.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---- Collapsible Section ----
function CollapsibleSection({ title, isOpen, onToggle, children }: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-xs font-semibold text-gray-600">{title}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {isOpen && <div className="p-4 border-t border-gray-200">{children}</div>}
    </div>
  );
}
