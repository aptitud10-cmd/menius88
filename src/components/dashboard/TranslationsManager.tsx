'use client';

import { useState, useEffect } from 'react';
import {
  Globe, Save, Check, Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

interface ProductRow { id: string; name: string; description: string; }
interface CategoryRow { id: string; name: string; }
interface TranslationRow { product_id?: string; category_id?: string; name: string; description?: string; }

export function TranslationsManager() {
  const [selectedLang, setSelectedLang] = useState('en');
  const [supportedLangs, setSupportedLangs] = useState<string[]>(['es']);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [productTrans, setProductTrans] = useState<Record<string, { name: string; description: string }>>({});
  const [categoryTrans, setCategoryTrans] = useState<Record<string, { name: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchTranslations = async (lang: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenant/translations?language=${lang}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
        setCategories(data.categories ?? []);
        setSupportedLangs(data.supported_languages ?? ['es']);

        // Build maps
        const pMap: Record<string, { name: string; description: string }> = {};
        (data.product_translations ?? []).forEach((t: any) => {
          pMap[t.product_id] = { name: t.name, description: t.description ?? '' };
        });
        setProductTrans(pMap);

        const cMap: Record<string, { name: string }> = {};
        (data.category_translations ?? []).forEach((t: any) => {
          cMap[t.category_id] = { name: t.name };
        });
        setCategoryTrans(cMap);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchTranslations(selectedLang); }, [selectedLang]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const newSupported = supportedLangs.includes(selectedLang)
        ? supportedLangs
        : [...supportedLangs, selectedLang];

      await fetch('/api/tenant/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLang,
          supported_languages: newSupported.includes('es') ? newSupported : ['es', ...newSupported],
          product_translations: products.map(p => ({
            product_id: p.id,
            name: productTrans[p.id]?.name ?? '',
            description: productTrans[p.id]?.description ?? '',
          })).filter(t => t.name),
          category_translations: categories.map(c => ({
            category_id: c.id,
            name: categoryTrans[c.id]?.name ?? '',
          })).filter(t => t.name),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* silent */ }
    setSaving(false);
  };

  const updateProductTrans = (productId: string, field: 'name' | 'description', value: string) => {
    setProductTrans(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value, name: field === 'name' ? value : (prev[productId]?.name ?? ''), description: field === 'description' ? value : (prev[productId]?.description ?? '') },
    }));
  };

  const updateCategoryTrans = (categoryId: string, value: string) => {
    setCategoryTrans(prev => ({ ...prev, [categoryId]: { name: value } }));
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-100 rounded-xl w-64" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-gray-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Language selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Traducir a:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                selectedLang === lang.code
                  ? 'bg-brand-600 text-white border-brand-600'
                  : supportedLangs.includes(lang.code)
                    ? 'bg-brand-50 text-brand-700 border-brand-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              <span>{lang.flag}</span> {lang.name}
              {supportedLangs.includes(lang.code) && selectedLang !== lang.code && (
                <Check className="w-3 h-3 text-brand-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Categories translations */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Languages className="w-3.5 h-3.5" /> Categorías ({categories.length})
          </h3>
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-2.5">
                <span className="text-sm text-gray-400 w-1/3 truncate">{cat.name}</span>
                <span className="text-gray-300">→</span>
                <input
                  type="text"
                  value={categoryTrans[cat.id]?.name ?? ''}
                  onChange={(e) => updateCategoryTrans(cat.id, e.target.value)}
                  placeholder={`${cat.name} in ${selectedLang.toUpperCase()}`}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product translations */}
      {products.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Languages className="w-3.5 h-3.5" /> Productos ({products.length})
          </h3>
          <div className="space-y-2">
            {products.map(prod => (
              <div key={prod.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-1/3 truncate">{prod.name}</span>
                  <span className="text-gray-300">→</span>
                  <input
                    type="text"
                    value={productTrans[prod.id]?.name ?? ''}
                    onChange={(e) => updateProductTrans(prod.id, 'name', e.target.value)}
                    placeholder={`${prod.name} in ${selectedLang.toUpperCase()}`}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                {prod.description && (
                  <div className="flex items-start gap-3 ml-0 sm:ml-[calc(33.33%+12px+16px)]">
                    <input
                      type="text"
                      value={productTrans[prod.id]?.description ?? ''}
                      onChange={(e) => updateProductTrans(prod.id, 'description', e.target.value)}
                      placeholder="Descripción traducida..."
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-100 text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all',
            saved ? 'bg-emerald-600' : 'bg-brand-600 hover:bg-brand-700 disabled:opacity-50'
          )}
        >
          {saved ? (
            <><Check className="w-4 h-4" /> Guardado</>
          ) : (
            <><Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar traducciones'}</>
          )}
        </button>
      </div>

      {products.length === 0 && categories.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin contenido para traducir</p>
          <p className="text-sm text-gray-300 mt-1">Agrega productos y categorías primero</p>
        </div>
      )}
    </div>
  );
}
